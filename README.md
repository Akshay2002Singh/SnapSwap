# SnapSwap

SnapSwap is a media sharing platform that allows authenticated users to upload images and videos, automatically generate watermarked previews. The project is split into a React frontend and an Express/MongoDB backend, both of which can be deployed independently.

## Topics

- [Project Structure](#project-structure)
- [Live Deployments](#live-deployments)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Upload Flow](#upload-flow)
- [Video Streaming](#video-streaming)
- [Scripts](#scripts)
- [Additional Documentation](#additional-documentation)

Additional guides:
- `docs/background-processing.md` – Background workers, watermark generation, and streaming behavior.
- `docs/db-design.md` – MongoDB schema, relationships, and index guidance.
- `docs/api-reference.md` – HTTP route catalogue and usage examples.

## Project Structure

- `frontend/` – React single-page app for uploading, searching, and viewing media.
- `backend/` – Express API handling authentication, uploads, watermark generation, and streaming.

## Live Deployments

- Frontend: https://snapswapfrontend.onrender.com/
- Backend: https://snapswapbackend.onrender.com/

## Prerequisites

- Node.js 18+ and npm (or another package manager) installed locally.
- MongoDB instance (Atlas or self-hosted).
- Optional: Redis instance if you want BullMQ-backed background processing.

## Environment Variables

Create a `.env` file in `backend/` with the following keys:

```
PORT=3003
MONGO_URI=<your Mongo connection string>
JWT_SECRET=<secret used to sign auth tokens>

# Watermark processing
WATERMARK_DRIVER=threadpool        # threadpool | bullmq
WATERMARK_QUEUE_NAME=watermark-processing
WATERMARK_BULL_CONCURRENCY=3
WATERMARK_THREADPOOL_MIN=1
WATERMARK_THREADPOOL_MAX=3
WATERMARK_JOB_ATTEMPTS=3
WATERMARK_JOB_BACKOFF_MS=5000

REDIS_URL=redis://user:pass@host:6379/0
```

If `WATERMARK_DRIVER` is set to `bullmq`, Redis must be reachable via `REDIS_URL`. When BullMQ fails to initialize, the service automatically falls back to the thread pool processor.

Create a `.env` file in `frontend/` with following keys:

```
REACT_APP_BACKEND_URL=http://localhost:3003
```

## Local Development

1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Run backend API (from `backend/`):
   ```bash
   npm run dev
   ```

3. Run frontend (from `frontend/`):
   ```bash
   npm start
   ```

4. The frontend expects the backend at `http://localhost:3003`. (can be updated via .env file in frontend)

## Upload Flow

1. Users upload an image or video.
2. The backend stores the original file and creates a database record with `isReady=false`.
3. A background worker (BullMQ or thread pool) takes the job, generates a watermarked version and updates `isReady=true`.
4. Only items with `isReady=true` are returned by listing and search APIs, ensuring users never see partially processed media.

## Video Streaming

- Videos are streamed with HTTP range support from `/api/images/stream/:filename`.
- Anonymous users automatically receive the watermarked version unless they supply a valid auth token.
- Authenticated users stream the original asset.

## Scripts

- `npm run dev` – start backend with hot reload (nodemon).
- `npm start` – start backend in production mode.
- Frontend scripts follow Create React App defaults.

