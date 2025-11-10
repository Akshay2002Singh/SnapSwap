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
const { verifyAuthToken } = require('../utils')
const { normalizeRelative, buildWatermarkPath } = require('../services/mediaUtils')
const { enqueueWatermarkJob } = require('../jobs/watermarkQueue')

// Ensure directories exist
const imagesDir = './static/images/'
const videosDir = './static/videos/'
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
}
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true })
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

// Get max file size from environment variable (default: 12MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '12582912') // 12MB in bytes (12 * 1024 * 1024)

// Create separate upload handlers for images and videos
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE // Max file size from environment variable
    }
})

router.post('/upload', fetchUser, (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
        // Handle multer errors (e.g., file size exceeded)
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
                return res.status(400).json({
                    'msg': `File size exceeds ${maxSizeMB}MB limit`
                })
            }
            // Handle other multer errors
            return res.status(400).json({
                'msg': err.message || "File upload error"
            })
        }
        next()
    })
}, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            'msg': "No file uploaded or file type not supported"
        })
    }

    // Determine file type
    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const originalRelativePath = normalizeRelative(req.file.path)
    const watermarkRelativePath = buildWatermarkPath(originalRelativePath)
    const originalAbsolutePath = path.resolve(originalRelativePath)
    const watermarkAbsolutePath = path.resolve(watermarkRelativePath)

    let createdRecord = null

    try {
        createdRecord = await ImageModel.create({
            title: req.body.title,
            path: originalRelativePath,
            watermarkPath: watermarkRelativePath,
            username: req.header.username,
            fileType: fileType,
            isReady: false,
            processingError: null,
        })

        await enqueueWatermarkJob({
            imageId: createdRecord._id.toString(),
            originalPath: originalRelativePath,
            watermarkPath: watermarkRelativePath,
            fileType,
        })

        // Create tags
        const tags = JSON.parse(req.body.tags || '[]')
        const trimmedTags = Array.isArray(tags) ? tags : []

        await Promise.all(
            trimmedTags
                .map((element) => String(element || '').trim())
                .filter(Boolean)
                .map((tag) =>
                    TagModel.create({
                        tag,
                        path: originalRelativePath
                    })
                )
        )

        return res.status(202).json({
            'msg': 'Upload received. Watermark processing scheduled.',
            'data': {
                _id: createdRecord._id,
                title: createdRecord.title,
                path: createdRecord.path,
                watermarkPath: createdRecord.watermarkPath,
                username: createdRecord.username,
                fileType: createdRecord.fileType,
                isReady: createdRecord.isReady,
                processingError: createdRecord.processingError,
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
        if (createdRecord?._id) {
            await ImageModel.findByIdAndDelete(createdRecord._id).catch(() => { })
        }
        await TagModel.deleteMany({ path: originalRelativePath }).catch(() => { })
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
    const data = await ImageModel.find({isReady: true}).catch((e) => {
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
                    let: { matchedPath: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$path', '$$matchedPath'] },
                                isReady: true,
                            }
                        }
                    ],
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