const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'Rapid'

/**
 * Safely verify a JWT auth token.
 * @param {string | undefined | null} token
 * @returns {object|null} Decoded token payload when valid, otherwise null.
 */
const verifyAuthToken = (token) => {
    if (!token) {
        return null
    }

    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        return null
    }
}

module.exports = {
    JWT_SECRET,
    verifyAuthToken,
}

