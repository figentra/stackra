---
"@stackra/filesystem": minor
---

Add `FileSystem#writeStream(key, source, options)` (ADR 0413): a `ReadableStream` or async iterable of bytes or
strings. The `s3` disk (S3, R2, MinIO) uploads in 8 MiB multipart parts and aborts on failure; every other disk buffers
into `write`. A failing stream stores nothing.
