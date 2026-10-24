---
"@stackra/filesystem": minor
---

Add `@stackra/filesystem`, the server disks of the programming model v3.1: the `FileSystem` port (`exists`, `read`,
`write`, `delete`, `list`, `stat`, `url`, `temporaryUrl`) in `./contracts`, with `FileStat`, `WriteOptions` and the
`EncoreBucket` port; `FilesystemConfig` (key `filesystem`: `disk`, `root`, `url`, `s3`) with its shipped schema
`FilesystemConfig$`, `MemoryFileSystemDriver` and `FileNotFoundError` in `.`; `LocalFileSystemDriver` (atomic writes),
`S3FileSystemDriver` (AWS S3, Cloudflare R2, MinIO; presigned temporary URLs; credentials from the AWS SDK chain) and
`EncoreBucketFileSystemDriver` (no `encore.dev` import) in `./node`; and `ElectronFileSystemDriver`, also exported as
`ElectronFileSystem`, in `./electron`. Every driver refuses a key that reaches outside the disk.
