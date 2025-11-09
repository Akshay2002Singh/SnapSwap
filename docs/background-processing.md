# SnapSwap Background Processing & Media Pipeline

This document explains how SnapSwap handles media uploads, watermark generation and video streaming.

## Topics

- [Overview](#overview)
- [Upload Lifecycle](#upload-lifecycle)
- [Configuring the Processor](#configuring-the-processor)
  - [BullMQ Requirements](#bullmq-requirements)
- [Watermark Version Handling](#watermark-version-handling)
- [Video Streaming](#video-streaming)
## Overview

When a user uploads an image or video, SnapSwap stores the original asset immediately but defers watermark generation to a background processor. This keeps upload latency low while ensuring public visitors only see watermarked previews.

The system uses two interchangeable execution modes:

- **Thread pool** (default) powered by [`piscina`](https://github.com/piscinajs/piscina) for environments without Redis.
- **BullMQ queue** backed by Redis for distributed or large-scale processing.

The driver is chosen through environment configuration. If BullMQ cannot initialize (for example, missing Redis credentials), the service transparently falls back to the thread pool.

## Upload Lifecycle

1. **Upload API (`POST /api/images/upload`)**
   - Accepts authenticated multipart uploads.
   - Persists the original media to disk.
   - Creates a MongoDB document with `isReady=false` and no watermark yet.
   - Enqueues a watermark job (BullMQ queue or thread pool) with the media metadata.

2. **Job Processor**
   - Reads the original file from disk.
   - Generates a watermarked version (using `sharp` for images, `fluent-ffmpeg` for videos).
   - Saves the watermarked file under `static/images` or `static/videos`.
   - Updates the MongoDB record: `isReady=true`, `processingError=null`.
   - On failure, stores `processingError` to aid debugging.

3. **Tag Synchronization**
   - Tags submitted with the upload are saved immediately.
   - Records remain discoverable via search only after the media is ready.

## Configuring the Processor

| Variable | Description | Default |
| --- | --- | --- |
| `WATERMARK_DRIVER` | `threadpool` or `bullmq` | `threadpool` |
| `WATERMARK_QUEUE_NAME` | BullMQ queue name | `watermark-processing` |
| `WATERMARK_BULL_CONCURRENCY` | Workers per BullMQ node | `3` |
| `WATERMARK_THREADPOOL_MIN` / `MAX` | Piscina thread counts | `1` / `3` |
| `WATERMARK_JOB_ATTEMPTS` | Retries for BullMQ jobs | `3` |
| `WATERMARK_JOB_BACKOFF_MS` | Exponential backoff base delay | `5000` |

### BullMQ Requirements

Set `WATERMARK_DRIVER=bullmq` and provide `REDIS_URL`. When the queue driver cannot start, the backend logs the error and reverts to the thread pool to keep uploads functional.

## Watermark Version Handling

- Watermarked filenames are prefixed with `watermark_` using the helper in `services/mediaUtils.js`.
- The original path and watermark path are both stored in MongoDB, allowing the middleware to serve the appropriate version.
- `middleware/staticWatermark.js` ensures unauthenticated visits to `/static/...` automatically resolve to the watermarked asset when available.

## Video Streaming

- Endpoint: `GET /api/images/stream/:filename`
- Features:
  - Validates path input and enforces access within `backend/static`.
  - Supports HTTP range requests for efficient seeking and playback.
  - Determines MIME type by file extension (`.mp4`, `.webm`, `.ogg`, `.mov`).
  - Guests receive the watermarked file when present; authenticated users with valid JWT stream the original.
