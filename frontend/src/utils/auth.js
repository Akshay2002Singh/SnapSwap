export const extractUsernameFromToken = (token) => {
    if (!token || typeof token !== 'string') {
        return null
    }

    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
        const payload = JSON.parse(atob(padded))

        if (payload && typeof payload.username === 'string') {
            return payload.username
        }
        return null
    } catch (error) {
        console.error('Failed to decode auth token:', error)
        return null
    }
}

