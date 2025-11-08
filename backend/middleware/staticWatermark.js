const fs = require('fs')
const path = require('path')
const { verifyAuthToken } = require('../utils')

const staticWatermarkMiddleware = (req, res, next) => {
    if (!req.path.startsWith('/static/')) {
        return next()
    }

    const token = req.header('authToken') || req.query?.authToken
    const decoded = verifyAuthToken(token)
    const isAuthenticated = Boolean(decoded)

    if (isAuthenticated) {
        return next()
    }

    const relativePath = req.path.replace(/^\/static\//, '')
    if (!relativePath) return next()

    const segments = relativePath.split('/')
    const filename = segments.pop()

    if (!filename || filename.startsWith('watermark_')) return next()

    const watermarkFilename = `watermark_${filename}`
    const watermarkRelativePath = segments.length
        ? `${segments.join('/')}/${watermarkFilename}`
        : watermarkFilename

    const watermarkFsPath = path.join(__dirname, '../static', watermarkRelativePath)

    if (!fs.existsSync(watermarkFsPath)) {
        return next()
    }

    const originalUrl = req.url
    const queryIndex = originalUrl.indexOf('?')
    const queryString = queryIndex >= 0 ? originalUrl.substring(queryIndex) : ''

    req.url = `/static/${watermarkRelativePath}${queryString}`
    req.originalUrl = req.url
    if (req._parsedUrl) {
        req._parsedUrl = undefined
    }
    return next()
}

module.exports = staticWatermarkMiddleware
