const path = require('path')

const normalizeRelative = (filePath) => filePath.replace(/\\/g, '/')

const buildWatermarkPath = (relativePath) => {
    const normalized = normalizeRelative(relativePath)
    const dir = path.posix.dirname(normalized)
    const filename = path.posix.basename(normalized)
    return `${dir}/watermark_${filename}`
}

module.exports = {
    normalizeRelative,
    buildWatermarkPath,
}


