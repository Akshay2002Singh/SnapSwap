const fs = require('fs')
const sharp = require('sharp')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

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

module.exports = {
    createImageWatermark,
    createVideoWatermark,
}


