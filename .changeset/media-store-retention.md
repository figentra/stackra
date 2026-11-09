---
"@stackra/media": minor
---

`MediaLibrary.store(bucket, bytes, mediaType, { retainUntil })` keeps the stored file unchangeable until `retainUntil`
through the disk's retention (`FileSystem.write`'s `retainUntil`: Object Lock in COMPLIANCE mode on `s3`); a disk that
cannot retain refuses with `RetentionUnsupportedError` (STA-2607).
