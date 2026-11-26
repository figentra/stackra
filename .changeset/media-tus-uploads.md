---
"@stackra/media": minor
---

Resumable tus uploads (ADR 0222 decision 2). A large file now goes through a tus server (tusd) in chunks and resumes
after a dropped connection, while its bytes still never pass through a service.

- `MediaLibrary.createResumableUpload(bucket, { mediaType, size })` checks the bucket's rules, records the upload
  (bucket, media type, size, expiry) beside `uploads/<id>` and answers tusd's creation URL with the headers to start
  it; nothing is signed, so it works on every disk tusd writes to (S3, R2, MinIO, GCS, a local folder).
- `media.upload.create_resumable@1` (`CreateResumableUploadAction`, `POST /uploads/create-resumable`, permission
  `media.upload.create_resumable`, L2) exposes it; its output is `CreateResumableUploadOutput`.
- `TusHookController` (`POST /media/tus-hooks`, `./node`) answers tusd's `pre-create` hook: behind the new secret
  `MEDIA_TUS_HOOK_SECRET` (`MediaConfig.tusHookSecret`), it lets an upload start once with exactly the recorded size
  (`MediaLibrary.admitResumableUpload`) and stores it under the server's id and media type, replacing the client's
  metadata. A repeated, resized, deferred-length, concatenated, unknown or expired start is rejected.
- `TusUploaderDriver` (`uploader: tus`) sends `PATCH`es of `media.tus.chunkBytes`, and after a failed request pauses
  (`media.tus.retryDelaysMs`), asks tusd for its offset and resumes from there. New settings:
  `resumableUploadEndpoint`, `tus.endpoint`, `tus.chunkBytes`, `tus.retryDelaysMs`.
- A tus upload lives `media.resumableUploadExpiresIn` (new, a day by default, at most seven), not the signed-URL
  lifetime `uploadExpiresIn`, so a long transfer is still claimable. tusd's `post-finish` hook
  (`MediaLibrary.finishResumableUpload`) keeps a finished upload claimable for `uploadExpiresIn` from its last byte;
  run tusd with `-hooks-enabled-events pre-create,post-finish`.
- `claim` of a tus upload takes the recorded media type, keeps an upload still short of its size (refused as
  incomplete), refuses a larger one, and deletes tusd's `.info` file with the record. `UploadRejectedError.reason`
  gains `started`.
- `claim` reads only the first 64 bytes of a file for its type check (from `readStream`), never the whole file, so a
  multi-gigabyte upload is not held in memory on the `s3`, `gcs` and `local` disks.
- New dependency: `@stackra/app` (the raw controller kind). New test tier: `test:int` runs a tusd integration test
  (Testcontainers, or the binary `TUSD_BINARY` names).
