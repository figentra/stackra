---
"@stackra/media": minor
---

`MediaLibrary.store(bucket, bytes, mediaType)` writes bytes the server made (a rendered PDF, a generated image) as a new
file of a bucket under the rules a claim applies: the bucket's media types, its size limit and the content check. Each
broken rule refuses with `UploadRejectedError` (`media_type`, `size`, `content`) and writes nothing (STA-2607).
