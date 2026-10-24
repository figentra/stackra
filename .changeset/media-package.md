---
"@stackra/media": minor
---

Add `@stackra/media`: the `Bucket` kind with `BucketVisibility`, `MediaType` and `ImageFormat`; signed direct uploads
that `MediaLibrary` issues and claims into a bucket (the `Upload` token, refused when foreign, expired, incomplete or
outside the bucket's rules); the `MediaDisk` port with its memory and S3/R2 drivers; the `Uploader` port with its memory
and HTTP drivers; `MediaConfig`; the `media.upload.create@1` action in `./node`; `useUpload` and `useImageVariant` in
`./react`; and `fakeUpload` in `./testing`.
