# @stackra/filesystem

Stackra server disks: the `FileSystem` port, its memory, local, S3/R2, Google Cloud Storage and Encore bucket
drivers, the Electron
main-process driver, and `FilesystemConfig`, which picks the driver.

**Tier:** `tier:lib` (`packages/data/filesystem`). Entries `.`, `./contracts`, `./node` and `./desktop`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`, zod, the AWS SDK S3 client and
`@google-cloud/storage`;
`electron` is an optional peer of `./desktop`.

## What is here

| Entry         | Symbol                                  | Use                                                                                                        |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `./contracts` | `FileSystem`                            | the port: `exists`, `read`, `write`, `delete`, `list`, `stat`, `url`, `temporaryUrl`, `move`, `signUpload` |
| `./contracts` | `EncoreBucket`                          | the slice of an Encore bucket the `encore_bucket` disk drives                                              |
| `./contracts` | `FileStat`, `WriteOptions`              | types: `{ path, size, lastModified, contentType }`, `{ contentType? }`                                     |
| `./contracts` | `SignedUpload`, `UploadRequest`         | types: `{ url, method: "PUT", headers }`, `{ contentType, expiresIn }`                                     |
| `.`           | `FilesystemConfig`, `FilesystemConfig$` | key `filesystem`: `disk`, `root`, `url`, `s3`, `gcs`                                                       |
| `.`           | `FilesystemOptions`                     | the shape of the configuration, for restating a field type in an override                                  |
| `.`           | `MemoryFileSystemDriver`                | `disk: memory`: a `Map`, for tests and as the safe default; `receive` plays a signed `PUT`                 |
| `.`           | `FileNotFoundError`                     | the `NotFound` refusal `read` and `stat` throw when nothing is stored under a key                          |
| `./node`      | `LocalFileSystemDriver`                 | `disk: local`: a folder (`root`), atomic writes                                                            |
| `./node`      | `S3FileSystemDriver`                    | `disk: s3`: AWS S3, Cloudflare R2 or MinIO; presigned temporary URLs                                       |
| `./node`      | `GcsFileSystemDriver`                   | `disk: gcs`: Google Cloud Storage (in-country GCP, ADR 0354); V4 signed URLs                               |
| `./node`      | `EncoreBucketFileSystemDriver`          | `disk: encore_bucket`: the bucket the generated Encore app binds                                           |
| `./desktop`   | `ElectronFileSystemDriver`              | `disk: electron`: the desktop app's files under `userData/<root>`                                          |

## Using a disk

Inject the port; never a driver:

```ts
constructor(files: FileSystem) { ... }

await this.files.write("exports/orders.csv", csv, { contentType: "text/csv" });
const link = await this.files.temporaryUrl("exports/orders.csv", Duration.minutes(10));
```

A key is relative and `/`-separated (`invoices/2026/inv_01.pdf`). A leading `/`, empty and `.` segments are dropped; a
`..` segment, a backslash or a NUL is a `RangeError`, so no key reaches outside the disk. `list(prefix)` matches keys by
prefix at any depth: `images/` is a folder, `images` also matches `images-2026/`.

A large file is written as a stream: `writeStream(key, source, options)` takes a web `ReadableStream` of bytes or any
async iterable of byte or string chunks. The `s3` disk (S3, R2, MinIO) uploads it in 8 MiB multipart parts, holding one
part in memory, and aborts the upload when the stream fails; every other disk reads the stream whole and calls `write`.
Either way nothing is stored under the key unless the whole stream was (ADR 0413).

```ts
async function* csvRows(orders: AsyncIterable<Order>) {
  yield "id,total\n";
  for await (const order of orders) yield `${order.id},${order.totalMinor}\n`;
}
await this.files.writeStream("exports/orders.csv", csvRows(orders), { contentType: "text/csv" });
```

A large file is read as a stream too: `readStream(key)` resolves to a web `ReadableStream` of bytes once the file is
found, so a missing file is a `FileNotFoundError` from the call, never from inside the stream. The `local`, `electron`,
`s3` and `gcs` disks stream from the store; `memory` and `encore_bucket` read the file whole and serve it as one chunk.

```ts
const body = await this.files.readStream("imports/orders.csv");
for await (const text of body.pipeThrough(new TextDecoderStream())) parser.push(text);
```

| Driver          | `url()`                                               | `temporaryUrl()`                     | `signUpload()`                           | `move()`            | `stat().contentType` | `stat().lastModified` |
| --------------- | ----------------------------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------- | -------------------- | --------------------- |
| `memory`        | `filesystem.url` (else `https://files.invalid`) + key | the URL with an unsigned `expires`   | a signature `receive` checks             | map move            | kept                 | the `Clock`'s now     |
| `local`         | `filesystem.url` + key                                | refuses: nothing checks a signature  | refuses (`TypeError`)                    | rename              | `null`               | file time             |
| `s3`            | `filesystem.url` + key                                | SigV4 presigned GET (at most 7 days) | SigV4 presigned PUT, content type signed | copy and delete     | kept                 | object time           |
| `gcs`           | `filesystem.url` + key                                | V4 signed GET (at most 7 days)       | V4 signed PUT, content type signed       | the store's move    | kept                 | object update time    |
| `encore_bucket` | the bucket's public URL                               | Encore signed download URL           | Encore signed upload URL, nothing signed | read, write, delete | kept                 | `null`                |
| `electron`      | `file:` URL                                           | the same `file:` URL                 | refuses (`TypeError`)                    | read, write, delete | `null`               | file time             |

### Direct uploads and moves

`signUpload(key, { contentType, expiresIn })` returns `{ url, method: "PUT", headers }`: the client puts the whole file
to `url` with exactly those headers, so the bytes never pass through a service (ADR 0222 decision 2). The size is never
signed (a browser sets Content-Length), and an Encore bucket signs no header, so the caller checks `stat(key)` after the
upload. `move(from, to)` keeps the media type; the default reads, writes and deletes, and the memory, local, s3 and gcs
disks use the store's own move. `@stackra/media` runs its signed uploads and claims through these two members on any
disk (ADR 0465; the old `MediaDisk` port and its S3 driver were folded in here, stackra-226). The bucket of the s3 and
gcs disks needs a CORS rule that allows `content-type` on `PUT`.

## Choosing the disk

Runway sets `config.filesystem.disk` per environment, typed `DriverName<FileSystem>`:

```yaml
config:
  filesystem:
    disk: s3
    url: https://cdn.acme.test/files
    s3:
      bucket: acme-files
      region: auto
      endpoint: https://<account>.r2.cloudflarestorage.com
```

No credential is configuration. The S3 driver uses the AWS SDK's default chain (`AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY`, which runway syncs from Infisical, or an instance role). The GCS driver reads Application
Default Credentials (workload identity on GCP) and takes only `gcs.bucket` and an optional `gcs.projectId`. The Encore driver imports no
`encore.dev`: the generated Encore app declares the bucket and binds `EncoreBucket`.

## Overriding

```ts
import type { DriverName } from "@stackra/container";
import { FilesystemConfig as BaseFilesystemConfig } from "@stackra/filesystem";
import type { FileSystem } from "@stackra/filesystem/contracts";

export class FilesystemConfig extends BaseFilesystemConfig {
  override disk: DriverName<FileSystem> = "s3";
  override s3 = { ...new BaseFilesystemConfig().s3, bucket: "acme-files" };
}
```

A nested object is replaced whole, so an override spreads a base instance's value (tsc refuses `this.<field>` in
the field's own initializer).

## Health check

`FilesystemHealthIndicatorDriver` (`.`) is this package's `HealthIndicator` driver, named `filesystem`: it asks the disk whether `health.path` exists (a missing path is an answer). Bind it and
`@stackra/app`'s `/readyz` runs it with the other bound indicators. `health` in this package's config tunes it:

| Field      | Default   | Meaning                                                                   |
| ---------- | --------- | ------------------------------------------------------------------------- |
| `timeout`  | `PT2S`    | How long the probe may take before it counts as failed.                   |
| `critical` | `true`    | A failed probe is `down` and fails `/readyz`; `false` reports `degraded`. |
| `path`     | `.health` | The path the probe asks about; it need not exist.                         |

A failed probe never throws; its detail names the error type only.

## Not here

- Named disks (`Named<FileSystem, "public">` with per-disk settings): one disk per member for now.
- Tenant file records, uploads, scanning and the `t/<tenantId>/<fileId>/<version>` layout: the files service and
  `@stackra/media` (ADR 0222).
- Module assets (`<module>::<path>`): `@stackra/assets`, which reads through this port (ADR 0234).
