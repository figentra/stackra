---
"@stackra/filesystem": patch
---

The `s3` disk moves an object above 5 GiB. One `CopyObject` copies at most 5 GiB, so `move` now asks the object's size
first and copies a larger one as a multipart upload of 512 MiB ranges (`UploadPartCopy`; larger ranges when 10,000 parts
would not reach the end). The copy keeps the content type, the cache, disposition, encoding and language headers and the
user metadata, copies each range only while the source keeps the ETag it was asked with, and is aborted on any failure,
leaving the source in place. A move up to 5 GiB is one `CopyObject` as before, after one extra HEAD request.
