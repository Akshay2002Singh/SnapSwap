const path = require('path')
const os = require('os')
const { Queue, Worker } = require('bullmq')
const Piscina = require('piscina')
const { processWatermarkJob } = require('./watermarkProcessor')

// ENV VARIABLES
const queueName = process.env.WATERMARK_QUEUE_NAME || 'watermark-processing'
const driver = (process.env.WATERMARK_DRIVER || 'threadpool').toLowerCase() // 'bullmq' or 'threadpool'

const bullConcurrency = parseInt(process.env.WATERMARK_BULL_CONCURRENCY || '3')
const threadPoolMax = parseInt(process.env.WATERMARK_THREADPOOL_MAX || '3')
const threadPoolMin = parseInt(process.env.WATERMARK_THREADPOOL_MIN || '1')

// INTERNAL STATE
let queue = null
let worker = null
let piscina = null
let activeDriver = driver

// THREADPOOL SETUP
const setupThreadPool = () => {
  piscina = new Piscina({
    filename: path.resolve(__dirname, './watermarkThreadWorker.js'),
    maxThreads: threadPoolMax,
    minThreads: threadPoolMin,
  })

  piscina.on('error', (error) => {
    console.error('[Watermark] Thread pool error:', error)
  })

  console.log('[Watermark] Initialized with ThreadPool')
}

// BULLMQ SETUP
const setupBullMq = async () => {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required for BullMQ driver.')
  }

  const connection = { url: process.env.REDIS_URL }

  queue = new Queue(queueName, { connection })

  worker = new Worker(
    queueName,
    async (job) => {
      await processWatermarkJob(job.data)
    },
    {
      connection,
      concurrency: bullConcurrency,
    }
  )

  worker.on('failed', (job, error) => {
    console.error(`[Watermark] Job ${job.id} failed:`, error)
  })

  console.log('[Watermark] Initialized with BullMQ and Redis URL')
}

// INITIALIZATION
const initWatermarkProcessing = async () => {
  if (activeDriver === 'bullmq') {
    try {
      await setupBullMq()
    } catch (err) {
      console.error('[Watermark] BullMQ initialization failed:', err)
      console.log('[Watermark] Falling back to ThreadPool instead.')
      activeDriver = 'threadpool'
      setupThreadPool()
    }
  } else {
    setupThreadPool()
  }

  return activeDriver
}

// JOB ENQUEUE
const enqueueWatermarkJob = async (payload) => {
  if (activeDriver === 'bullmq' && queue) {
    await queue.add('watermark', payload, {
      attempts: parseInt(process.env.WATERMARK_JOB_ATTEMPTS || '3'),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.WATERMARK_JOB_BACKOFF_MS || '5000'),
      },
      removeOnComplete: parseInt('2'),
      removeOnFail: parseInt('3'),
    })
  } else if (piscina) {
    await piscina.runTask(payload)
  } else {
    console.error('[Watermark] No active driver found. Did you call initWatermarkProcessing()?')
  }
}

// EXPORTS
module.exports = {
  enqueueWatermarkJob,
  initWatermarkProcessing,
  getActiveWatermarkDriver: () => activeDriver,
}
