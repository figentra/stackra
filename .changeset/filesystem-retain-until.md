---
"@stackra/filesystem": minor
---

`FileSystem.write` (and `writeStream`) take `retainUntil`: the file is kept unchangeable until then (WORM). The `s3` disk
stores it under Object Lock in COMPLIANCE mode, which needs a bucket created with Object Lock on. The memory and local
disks record it and refuse a write, move or delete before then with `FileRetainedError`. The Encore bucket, GCS and Expo
disks refuse a retained write with `RetentionUnsupportedError` rather than store an unprotected file.
