---
"@stackra/media": minor
---

Media stores on the `FileSystem` disk of `@stackra/filesystem` (ADR 0465), so it runs on the memory, local, S3/R2, GCS
and Encore bucket disks. Removed: the `MediaDisk` port, `MemoryMediaDiskDriver`, `S3MediaDiskDriver`, the
`MediaObject`, `SignedUpload` and `UploadRequest` types (the last two live in `@stackra/filesystem/contracts`) and the
`media.disk` setting (set `filesystem.disk`). `MediaLibrary` takes `FileSystem` and records each upload's bucket key
and expiry beside it as `uploads/<id>.json` instead of signed metadata, so a disk that signs no metadata works; a claim
of an upload signed before this change is refused as incomplete. `fakeUpload` needs the memory `FileSystem` disk.
