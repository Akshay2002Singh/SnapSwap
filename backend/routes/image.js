const express = require('express')
const router = express.Router()
const multer = require('multer')
const fetchUser = require('../middleware/fetchuser')
const ImageModel = require('../database/models/Images')
const TagModel = require('../database/models/tags')
const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const { verifyAuthToken } = require('../utils')

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Ensure directories exist
const imagesDir = './static/images/'
const videosDir = './static/videos/'
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
}
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true })
}

const normalizeRelative = (filePath) => filePath.replace(/\\/g, '/')

const buildWatermarkPath = (relativePath) => {
    const normalized = normalizeRelative(relativePath)
    const dir = path.posix.dirname(normalized)
    const filename = path.posix.basename(normalized)
    return `${dir}/watermark_${filename}`
}

const createImageWatermark = async (sourcePath, targetPath) => {
    const image = sharp(sourcePath)
    const metadata = await image.metadata()
    const width = metadata.width || 800
    const height = metadata.height || 600
    const overlaySvg = `
        <svg width="${width}" height="${height}">
            <rect width="100%" height="100%" fill="#000000" fill-opacity="0.2"/>
            <style>
                .watermark {
                    fill: rgba(255,255,255,0.65);
                    font-weight: 700;
                    font-size: ${Math.round(Math.min(width, height) / 4)}px;
                    font-family: 'Arial', 'Helvetica', sans-serif;
                }
            </style>
            <text x="50%" y="50%" text-anchor="middle" class="watermark" transform="rotate(-30 ${width / 2} ${height / 2})">
                SnapSwap
            </text>
        </svg>
    `

    await sharp(sourcePath)
        .composite([{ input: Buffer.from(overlaySvg), gravity: 'center' }])
        .toFile(targetPath)
}

const createVideoWatermark = async (sourcePath, targetPath) => {
    const overlaySvg = `
        <svg width="800" height="200">
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.35)" rx="28" ry="28"/>
            <style>
                .headline {
                    fill: rgba(255,255,255,0.85);
                    font-weight: 700;
                    font-size: 72px;
                    font-family: 'Arial', 'Helvetica', sans-serif;
                }
                .subhead {
                    fill: rgba(255,255,255,0.75);
                    font-weight: 600;
                    font-size: 32px;
                    font-family: 'Arial', 'Helvetica', sans-serif;
                }
            </style>
            <text x="50%" y="55%" text-anchor="middle" class="headline">SnapSwap</text>
            <text x="50%" y="85%" text-anchor="middle" class="subhead">Watermarked Preview</text>
        </svg>
    `

    const overlayTempPath = `${targetPath}.overlay.png`
    await sharp({
        create: {
            width: 800,
            height: 200,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite([{ input: Buffer.from(overlaySvg), gravity: 'center' }])
        .png()
        .toFile(overlayTempPath)

    await new Promise((resolve, reject) => {
        ffmpeg(sourcePath)
            .input(overlayTempPath)
            .complexFilter([
                {
                    filter: 'overlay',
                    options: {
                        x: '(main_w-overlay_w)/2',
                        y: '(main_h-overlay_h)/2'
                    }
                }
            ])
            .outputOptions([
                '-c:v libx264',
                '-preset ultrafast',
                '-crf 23',
                '-c:a copy'
            ])
            .save(targetPath)
            .on('end', () => {
                fs.unlink(overlayTempPath, () => resolve())
            })
            .on('error', (error) => {
                fs.unlink(overlayTempPath, () => reject(error))
            })
    })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on file type
        if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir)
        } else {
            cb(null, imagesDir)
        }
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '-' + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else if (allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// Create separate upload handlers for images and videos
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 12 * 1024 * 1024 // 12MB max for videos (also applies to images)
    }
})

router.post('/upload', fetchUser, upload.single("photo"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            'msg': "No file uploaded or file type not supported"
        })
    }

    // Determine file type
    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Check file size for videos (5MB limit)
    if (fileType === 'video' && req.file.size > 12 * 1024 * 1024) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path)
        return res.status(400).json({
            'msg': "Video size exceeds 5MB limit"
        })
    }

    const originalRelativePath = normalizeRelative(req.file.path)
    const watermarkRelativePath = buildWatermarkPath(originalRelativePath)
    const originalAbsolutePath = path.resolve(originalRelativePath)
    const watermarkAbsolutePath = path.resolve(watermarkRelativePath)

    try {
        if (fs.existsSync(watermarkAbsolutePath)) {
            fs.unlinkSync(watermarkAbsolutePath)
        }

        if (fileType === 'image') {
            await createImageWatermark(originalAbsolutePath, watermarkAbsolutePath)
        } else {
            await createVideoWatermark(originalAbsolutePath, watermarkAbsolutePath)
        }

        const createdRecord = await ImageModel.create({
            title: req.body.title,
            path: originalRelativePath,
            watermarkPath: watermarkRelativePath,
            username: req.header.username,
            fileType: fileType
        })

        // Create tags
        const tags = JSON.parse(req.body.tags || '[]')
        tags.forEach((element) => {
            if (element.trim()) {
                TagModel.create({
                    tag: element,
                    path: originalRelativePath
                }).catch(e => console.log(e))
            }
        });

        res.json({
            'msg': fileType === 'video' ? "video saved" : "image saved",
            'data': {
                _id: createdRecord._id,
                title: createdRecord.title,
                path: createdRecord.path,
                watermarkPath: createdRecord.watermarkPath,
                username: createdRecord.username,
                fileType: createdRecord.fileType
            }
        })
    } catch (error) {
        // Delete files if processing fails
        if (fs.existsSync(originalAbsolutePath)) {
            fs.unlinkSync(originalAbsolutePath)
        }
        if (fs.existsSync(watermarkAbsolutePath)) {
            fs.unlinkSync(watermarkAbsolutePath)
        }
        console.error('Error saving file:', error)
        return res.status(500).json({
            'msg': "file not saved"
        })
    }
})


// Video streaming endpoint with range request support
router.get('/stream/:filename', async (req, res) => {
    const filename = req.params.filename

    if (!filename) {
        return res.status(400).json({ msg: 'Filename required' })
    }

    // Basic sanitization to avoid path traversal
    if (filename.includes('..') || path.basename(filename) !== filename) {
        return res.status(400).json({ msg: 'Invalid filename' })
    }

    const videoPath = path.normalize(path.join(__dirname, '../static/videos', filename))

    // Security check: ensure the path is within the static directory
    const staticDir = path.normalize(path.join(__dirname, '../static'))
    if (!videoPath.startsWith(staticDir)) {
        return res.status(403).json({ msg: 'Access denied' })
    }

    const token = req.header('authToken') || req.query.authToken
    const isAuthenticated = Boolean(verifyAuthToken(token))

    const relativePath = normalizeRelative(path.posix.join('static/videos', filename))
    let mediaRecord = null

    try {
        mediaRecord = await ImageModel.findOne({ path: relativePath }).lean()

        if (!mediaRecord && filename.startsWith('watermark_')) {
            const originalFilename = filename.replace(/^watermark_/, '')
            const originalRelativePath = normalizeRelative(path.posix.join('static/videos', originalFilename))
            mediaRecord = await ImageModel.findOne({ path: originalRelativePath }).lean()
        }
    } catch (error) {
        console.error('Error locating media record for stream:', error)
    }

    let targetPath = videoPath
    let watermarkPath = null

    if (filename.startsWith('watermark_')) {
        if (mediaRecord?.watermarkPath) {
            watermarkPath = path.normalize(path.join(__dirname, '..', mediaRecord.watermarkPath))
        }
    } else {
        const watermarkRelativePath = mediaRecord?.watermarkPath || buildWatermarkPath(relativePath)
        watermarkPath = path.normalize(path.join(__dirname, '..', watermarkRelativePath))
    }

    if (!isAuthenticated) {
        const candidatePath = filename.startsWith('watermark_') ? videoPath : watermarkPath

        if (!candidatePath) {
            return res.status(404).json({ msg: 'Watermarked video not found' })
        }

        if (!candidatePath.startsWith(staticDir)) {
            return res.status(403).json({ msg: 'Access denied' })
        }

        if (!fs.existsSync(candidatePath)) {
            return res.status(404).json({ msg: 'Watermarked video not found' })
        }

        targetPath = candidatePath
    } else {
        if (!targetPath.startsWith(staticDir)) {
            return res.status(403).json({ msg: 'Access denied' })
        }

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ msg: 'Video not found' })
        }
    }

    if (!targetPath.startsWith(staticDir)) {
        return res.status(403).json({ msg: 'Access denied' })
    }

    const stat = fs.statSync(targetPath)
    const fileSize = stat.size
    const range = req.headers.range

    // Determine content type based on file extension
    const ext = path.extname(targetPath).toLowerCase()
    const contentTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime'
    }
    const contentType = contentTypes[ext] || 'video/mp4'

    if (range) {
        // Parse range header
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunksize = (end - start) + 1
        const file = fs.createReadStream(targetPath, { start, end })
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        }
        res.writeHead(206, head)
        file.pipe(res)
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
        }
        res.writeHead(200, head)
        fs.createReadStream(targetPath).pipe(res)
    }
})

router.get('/getImages', async (req, res) => {
    let page = req.query.page;
    const data = await ImageModel.find({}).catch((e) => {
        return res.status(400).json({
            'msg': "error"
        })
    })
    var new_data = []
    for (let i = (page * 10); i < ((page + 1) * 10) && i < data.length; ++i) {
        new_data.push(data[i])
    }
    res.json({
        data: new_data,
        morePage: ((page + 1) * 10) < data.length
    })
})

router.delete('/:id', fetchUser, async (req, res) => {
    try {
        const image = await ImageModel.findById(req.params.id)
        if (!image) {
            return res.status(404).json({ msg: 'Media not found' })
        }

        if (image.username !== req.header.username) {
            return res.status(403).json({ msg: 'Not authorized to delete this media' })
        }

        const staticDir = path.normalize(path.join(__dirname, '..', 'static'))

        const resolvePathIfSafe = (relativePath) => {
            if (!relativePath) return null
            const absolutePath = path.normalize(path.resolve(__dirname, '..', relativePath))
            const relativeToStatic = path.relative(staticDir, absolutePath)
            if (
                relativeToStatic.startsWith('..') ||
                path.isAbsolute(relativeToStatic)
            ) {
                return null
            }
            return absolutePath
        }

        const safeUnlink = async (targetPath) => {
            if (!targetPath) return
            try {
                await fsPromises.unlink(targetPath)
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error
                }
            }
        }

        await Promise.all([
            safeUnlink(resolvePathIfSafe(image.path)),
            safeUnlink(resolvePathIfSafe(image.watermarkPath)),
        ])

        await ImageModel.findByIdAndDelete(req.params.id)
        await TagModel.deleteMany({ path: image.path })

        return res.json({ msg: 'Media deleted' })
    } catch (error) {
        console.error('Error deleting media:', error)
        return res.status(500).json({ msg: 'Failed to delete media' })
    }
})

router.post('/search', async (req, res) => {
    try {
        const rawValue = req.body.val
        let tagList = []

        if (Array.isArray(rawValue)) {
            tagList = rawValue
        } else if (typeof rawValue === 'string') {
            try {
                tagList = JSON.parse(rawValue || '[]')
            } catch (error) {
                return res.status(400).json({ msg: 'Invalid search payload' })
            }
        }

        const tags = (tagList || [])
            .filter(Boolean)
            .map((tag) => String(tag).trim().toLowerCase())
            .filter(Boolean)

        if (!tags.length) {
            return res.json({ data: [], msg: 'data not found' })
        }

        const imageCollectionName = ImageModel.collection.name

        const results = await TagModel.aggregate([
            {
                $match: {
                    $or: tags.map(tag => ({
                        tag: { $regex: tag, $options: 'i' }
                    }))
                }
            },
            { $group: { _id: '$path', matchCount: { $sum: 1 } } },
            { $sort: { matchCount: -1, _id: 1 } },
            {
                $lookup: {
                    from: imageCollectionName,
                    localField: '_id',
                    foreignField: 'path',
                    as: 'media'
                }
            },
            { $unwind: '$media' },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ['$media', { matchCount: '$matchCount' }]
                    }
                }
            }
        ])

        if (!results.length) {
            return res.json({ data: [], msg: 'data not found' })
        }

        return res.json({ data: results, msg: 'data found' })
    } catch (error) {
        console.error('Search aggregation failed:', error)
        return res.status(500).json({ msg: 'error' })
    }
})

module.exports = router