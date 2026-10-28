---
"@stackra/infra-aws": patch
"@stackra/infra-gcp": patch
---

The files bucket follows `filesystem.disk` only: a runway `media.disk` is no longer read (ADR 0465 folded `MediaDisk`
into `FileSystem`, so media stores through the file disk). A root runway that put only `media.disk` on `s3` now needs
`filesystem.disk: s3` to keep its files bucket.
