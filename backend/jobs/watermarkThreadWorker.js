const { processWatermarkJob } = require('./watermarkProcessor')

module.exports = async (payload) => {
    return processWatermarkJob(payload)
}


