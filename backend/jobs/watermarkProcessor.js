const fs = require('fs')
const path = require('path')
const ImageModel = require('../database/models/Images')
const { createImageWatermark, createVideoWatermark } = require('../services/watermark')

const ensureDir = (targetPath) => {
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

const processWatermarkJob = async (payload) => {
    const { imageId, originalPath, watermarkPath, fileType } = payload

    if (!imageId || !originalPath || !watermarkPath || !fileType) {
        throw new Error('Invalid watermark job payload')
    }

    const originalAbsolutePath = path.resolve(originalPath)
    const watermarkAbsolutePath = path.resolve(watermarkPath)

    ensureDir(watermarkAbsolutePath)

    try {
        if (!fs.existsSync(originalAbsolutePath)) {
            throw new Error(`Source file missing at ${originalAbsolutePath}`)
        }

        if (fs.existsSync(watermarkAbsolutePath)) {
            fs.unlinkSync(watermarkAbsolutePath)
        }

        if (fileType === 'image') {
            await createImageWatermark(originalAbsolutePath, watermarkAbsolutePath)
        } else if (fileType === 'video') {
            await createVideoWatermark(originalAbsolutePath, watermarkAbsolutePath)
        } else {
            throw new Error(`Unsupported file type: ${fileType}`)
        }

        await ImageModel.findByIdAndUpdate(
            imageId,
            {
                $set: {
                    isReady: true,
                    processingError: null,
                }
            },
            { new: false }
        )
    } catch (error) {
        await ImageModel.findByIdAndUpdate(
            imageId,
            {
                $set: {
                    processingError: error.message,
                }
            },
            { new: false }
        )
        throw error
    }
}

module.exports = {
    processWatermarkJob,
}


