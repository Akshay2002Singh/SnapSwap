# SnapSwap API Reference

This document summarizes the public HTTP routes exposed by the SnapSwap backend (`backend/`). All paths are relative to the API base URL (e.g. `http://localhost:3003` in local development).

## Topics

- [Conventions](#conventions)
- [Health Routes](#health-routes)
- [Authentication Routes](#authentication-routes)
- [Media Routes](#media-routes)
- [Search Routes](#search-routes)

## Conventions

- **Authentication** – Protected routes require an `authToken` header containing a valid JWT issued by `/api/auth/signin`.
- **Content Types** – Unless noted otherwise, requests and responses use `application/json`.
- **Pagination** – Media listings page in chunks of 10 items via the `page` query parameter (0-indexed).

## Health Routes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Returns `{ "msg": "Server is working" }` for basic uptime checks. |

## Authentication Routes

All auth routes live under `/api/auth`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/signup` | No | Registers a new user. Body must include `email`, `username`, `password`. Validation errors are returned in `errors_array`. |
| `POST` | `/signin` | No | Authenticates credentials. Returns `{ "authToken": "<jwt>" }` on success; otherwise indicates invalid user or password. |
| `POST` | `/isValidUser` | No | Checks if a username is available. Body: `{ "username": "desired" }`. Returns `{ "valid": true/false }`. |
| `POST` | `/isValidEmail` | No | Checks if an email is available. Body: `{ "email": "user@example.com" }`. Returns `{ "valid": true/false }`. |

## Media Routes

All media routes live under `/api/images`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/upload` | Yes | Multipart upload (`photo` field). Saves original asset, creates DB record with `isReady=false`, and triggers background watermarking. Returns `202 Accepted` with queued job metadata. |
| `GET` | `/getImages` | No | Lists ready media. Query `page` (default `0`) selects pages of 10 items each. Only documents with `isReady=true` are returned. |
| `GET` | `/stream/:filename` | Optional | Streams video content with HTTP range support. Guests receive the watermark version when available; authenticated users (valid `authToken`) receive the original. |
| `DELETE` | `/:id` | Yes | Removes a media record by MongoDB `_id`, along with associated files and tags. Only the owner (`username`) can delete. |

### Upload Request Example

```
POST /api/images/upload
Headers:
  authToken: <jwt>
Content-Type: multipart/form-data
Body:
  photo: <file> (image/* or video/*)
  title: "Sunset"
  tags: ["nature","sunset"]
```

Successful responses return status `202` with the saved document and `isReady=false`. The watermark job updates the record asynchronously.

## Search Routes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/images/search` | No | Performs a tag-based search. Accepts an array payload (`["tag1","tag2"]`) or a JSON-encoded string. Results include only ready media, sorted by match count. |


