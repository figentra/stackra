---
"@stackra/filesystem": minor
---

`FileSystem` gains `move(from, to)` and `signUpload(path, { contentType, expiresIn })`, folded in from media's
`MediaDisk` (ADR 0465). `move` reads, writes and deletes by default; the memory (map move), local (rename), S3 (copy
and delete) and GCS (the store's move) disks override it. `signUpload` refuses by default; the memory, S3/R2 (SigV4
PUT, content type signed, no checksum), GCS (V4 PUT, content type signed) and Encore bucket (`signedUploadUrl`) disks
sign. New types `SignedUpload` and `UploadRequest` in `./contracts`; `EncoreBucket` gains `signedUploadUrl`, which
gen's generated bucket driver must forward. `MemoryFileSystemDriver` gains `receive` (the store's side of a signed
`PUT`) and serves URLs from `https://files.invalid` when `filesystem.url` is unset.
