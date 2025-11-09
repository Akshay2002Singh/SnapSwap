# SnapSwap Database Design

This guide outlines the MongoDB schema, indexes, and data relationships used by the SnapSwap backend. It focuses on how media uploads, tags, and authentication data are structured to support performant queries and background processing.

## Topics

- [Collections](#collections)
  - [ImageModel](#imagemodel)
  - [TagModel](#tagmodel)
  - [AuthModel](#authmodel)
- [Relationships](#relationships)
- [Indexes](#indexes)
## Collections

### ImageModel

Stored in `backend/database/models/Images.js`.

| Field | Type | Description |
| --- | --- | --- |
| `title` | `String` | User-supplied media title (required). |
| `path` | `String` | Relative filesystem path to the original media (unique, indexed). |
| `watermarkPath` | `String` | Relative path to the watermarked derivative (unique, indexed). |
| `isReady` | `Boolean` | Indicates whether watermark processing completed successfully (indexed). |
| `processingError` | `String` \| `null` | Last known error message when processing fails. |
| `username` | `String` | Owner username, duplicated for quick filtering. |
| `fileType` | `String` | `'image'` or `'video'` |

**Usage highlights**

- Uploads initially set `isReady=false` until background processing succeeds.
- Watermark tasks update `isReady=true`.
- Search and listing endpoints exclude documents with `isReady=false`.

### TagModel

Defined in `backend/database/models/tags.js`.

| Field | Type | Description |
| --- | --- | --- |
| `tag` | `String` | Lowercased tag string used for searches. |
| `path` | `String` | Reference (by media path) to the owning media item. |

**Usage highlights**

- Each tag references an `ImageModel` via the media `path`. This avoids populating `ObjectId` references while still supporting efficient lookups.
- Aggregation pipelines group by `path` and join (`$lookup`) back to the `ImageModel` collection.

### AuthModel

Located at `backend/database/models/auth.js`.

| Field | Type | Description |
| --- | --- | --- |
| `name` | `String` | Display name for the account. |
| `username` | `String` | Unique login identifier. |
| `password` | `String` | Hashed password (bcrypt). |

**Usage highlights**

- JWTs embed the `user.id` and `user.username` for request-level authorization.
- `username` is duplicated into media records to authorize delete operations without extra lookups.

## Relationships

- `ImageModel` and `TagModel` are linked via the `path` field. This denormalized key keeps the schema simple and allows concurrent uploads before MongoDB assigns the media `_id`.
- Authentication records remain isolated from media collections; only `username` is shared.

## Indexes

- `AuthModel.username`
- `AuthModel.email`
- `ImageModel.path`
- `ImageModel.watermarkPath`
- `ImageModel.isReady`
- `TagModel.tag`
