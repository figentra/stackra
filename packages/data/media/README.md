# @stackra/media

<!--
Stackra file contract:
Purpose: the reader guide of @stackra/media: buckets, the upload flow, `Upload<Bucket>` in shapes and gen's
         schema for it, variants, configuration, scanning, server-side processing (byte reads, image transforms with
         compositing, DOCX and PDF text extraction, Arabic OCR, C2PA content credentials) and testing.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0222; ADR 0465 (one object-storage port); ADR 0294 (decision 26); STA-1218 (gen's `upload` shape kind); ADR 0234 and R3-SO-13
                    (text extraction in region); R2-5, M7 (self-hosted OCR default); ADR 0173; COM-73, COM-294;
                    STA-789.
-->

Stackra media: the `Bucket` kind, signed direct uploads and resumable tus uploads that `MediaLibrary` claims into a bucket, stored on the
`FileSystem` disk of `@stackra/filesystem` (memory, local, S3/R2, GCS or Encore bucket, ADR 0465), the `sharp` image transformer with compositing, the in-region `document` text
extractor (DOCX and PDF), the in-region `paddle_ocr` text extractor (Arabic OCR), the `c2pa` content credentials, the client `Uploader` port with its memory, HTTP and tus drivers, `MediaConfig`, the
`upload.create` and `upload.create_resumable` actions, the tus hook controller, `useUpload`, `useImageVariant` and `fakeUpload`.

**Tier:** `tier:lib` (`packages/data/media`). Entries `.`, `./contracts`, `./node`, `./react` and `./testing`. Depends
on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/actions`, `@stackra/app` (the raw tus hook controller), `@stackra/filesystem` (the disk media stores on), zod, the AWS SDK S3 client (GuardDuty tags), sharp
(libvips), unpdf (pdf.js), fflate and `@contentauth/c2pa-node` (c2pa-rs); React is an optional peer of `./react`.

## What is here

| Entry         | Symbol                                                                                                                 | Use                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.`           | `Bucket`                                                                                                               | the kind base of a `models/<name>.bucket.ts` declaration                               |
| `.`           | `BucketVisibility`, `MediaType`, `ImageFormat`                                                                         | who reads a bucket; accepted types (IANA codes); variant formats                       |
| `.`           | `Upload`                                                                                                               | the token an action input takes instead of bytes; `Upload.schema` is its wire schema   |
| `.`           | `MediaLibrary`                                                                                                         | `createUpload`, `createResumableUpload`, `admitResumableUpload`, `claim`, `temporaryUrl` |
| `.`           | `MediaConfig`, `MediaConfig$`, `MediaOptions`                                                                          | key `media`: `uploader`, `uploadExpiresIn`, `uploadEndpoint`, `resumableUploadEndpoint`, `tus`, `scanner`, `ocr`, `c2pa` |
| `.`           | `Uploader`, `MemoryUploaderDriver`, `HttpUploaderDriver`, `TusUploaderDriver`                                          | the client side of an upload                                                           |
| `.`           | `ResumableUpload`, `AdmittedUpload` (types)                                                                            | what `createResumableUpload` and `admitResumableUpload` answer                         |
| `.`           | `UploadBucketMismatchError`, `UploadExpiredError`, `UploadIncompleteError`, `UploadRejectedError`, `UploadFailedError` | the refusals                                                                           |
| `.`           | `registerBuckets`                                                                                                      | how gen's entry hands over the derived bucket keys                                     |
| `./contracts` | `ImageTransformer`, `ImageTransform`, `ImageLayer`, `TextExtractor`, `ExtractedText`                                   | the processing ports and the types they speak                                          |
| `./contracts` | `ContentCredentials`, `ContentCredential`                                                                              | the C2PA port and the claim it signs                                                   |
| `./node`      | `SharpImageTransformerDriver`                                                                                          | `ImageTransformer` on sharp: resize, composite layers, re-encode, no metadata          |
| `./node`      | `DocumentTextExtractorDriver`                                                                                          | `TextExtractor` for DOCX and PDF text layers, in process (in region)                   |
| `./node`      | `PaddleOcrTextExtractorDriver`                                                                                         | `TextExtractor` OCR with Arabic, via the in-region PaddleOCR service (cert. pending)   |
| `./node`      | `C2paContentCredentialsDriver`                                                                                         | `ContentCredentials` on c2pa-rs: sign and read C2PA manifests (cert. pending)          |
| `./node`      | `CreateUploadAction`, `CreateUploadInput`, `CreateUploadOutput`                                                        | `media.upload.create@1`, `POST /uploads`                                               |
| `./node`      | `CreateResumableUploadAction`, `CreateResumableUploadOutput`                                                           | `media.upload.create_resumable@1`, `POST /uploads/create-resumable` (input `CreateUploadInput`) |
| `./node`      | `TusHookController`                                                                                                    | the raw `POST /media/tus-hooks` tusd's `pre-create` hook calls                          |
| `./react`     | `useUpload`, `useImageVariant`                                                                                         | upload a file; size an image                                                           |
| `./testing`   | `fakeUpload`                                                                                                           | a finished upload in a test, on the memory `FileSystem` disk                           |

## Declaring a bucket

```ts
// src/modules/catalogue/models/product-images.bucket.ts — key catalogue.product_images
export class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 5_000_000,
  accept: [MediaType.Jpeg, MediaType.Png, MediaType.Webp],
  variants: { card: { width: 600 }, zoom: { width: 1_600 } },
}) {}
```

Gen derives the key from the file and hands it over with `registerBuckets`; without that, the key is the class name in
snake_case (`product_images`). SVG is not a `MediaType`: a public SVG can run script.

## The upload flow

The bytes never pass through a service.

1. The client calls `useUpload()` and then the returned function with a `File`. The `http` uploader posts
   `{ bucket, mediaType, size }` to `media.uploadEndpoint` (`media.upload.create@1`).
2. `MediaLibrary.createUpload` checks the bucket's types and size, mints `upl_…`, signs a `PUT` of `uploads/<id>`
   through `FileSystem.signUpload` (the media type is signed where the disk can: S3, R2, GCS, memory) and writes the
   bucket key and the expiry beside it as `uploads/<id>.json`, which the client cannot reach. The token carries the
   id only.
3. The client puts the bytes to the signed URL and sends the token to an action (`image: Upload<ProductImagesBucket>`).
4. The action calls `media.claim(input.image, ProductImagesBucket)`. The claim reads the record and what the store
   received, then refuses in this order: no record (`UploadIncompleteError`), another bucket
   (`UploadBucketMismatchError`), past its expiry (`UploadExpiredError`), no file (`UploadIncompleteError`), and a type
   or size the bucket does not take (`UploadRejectedError`, after deleting the file and its record). Otherwise it moves
   the file to `<visibility>/<bucket key as folders>/<id>.<subtype>` with `FileSystem.move`, deletes the record and
   returns `{ id, bucket, path, url, mediaType, size }`. A second claim of the same token finds no record.

The local and Electron disks cannot sign uploads, so `createUpload` refuses there (`TypeError`); use the memory disk in
development and tests. An Encore bucket signs no header, so the type the claim checks is the one the client sent.

### Resumable uploads (tus)

A large file (a video, a scan bundle) goes through a tus server instead of one signed `PUT`, so a dropped connection
resumes where the server stopped instead of starting over (ADR 0222 decision 2). The bytes still never pass through a
service: tusd receives them and writes them to the same `FileSystem` store.

1. With `media.uploader: tus`, `useUpload` posts `{ bucket, mediaType, size }` to `media.resumableUploadEndpoint`
   (`media.upload.create_resumable@1`). `MediaLibrary.createResumableUpload` checks the bucket's types and size, mints
   `upl_…` and records the bucket, the media type, the size, the expiry (`media.resumableUploadExpiresIn`, a day by
   default: the whole transfer, pauses and resumes included, may take that long; it is not the signed-URL lifetime
   `uploadExpiresIn`) and `started: false` as `uploads/<id>.json`. It
   answers the tus server's creation URL (`media.tus.endpoint`) and the headers to start with (`Tus-Resumable` and
   `Upload-Metadata: upload <base64 id>`). Nothing is signed, so it works on every disk tusd writes to.
2. The `tus` uploader `POST`s the creation request to tusd. tusd's `pre-create` hook calls `TusHookController`
   (`POST /media/tus-hooks`), which checks the hook password and calls `MediaLibrary.admitResumableUpload`: the upload
   must be waiting, unexpired, not started yet, and announce exactly the recorded size (no deferred length, no
   concatenation). It is marked started and tusd is told to store it as `uploads/<id>` with the metadata replaced whole
   by `{ upload, filetype }` from the record, so a client cannot choose a storage path or a stored type. A refusal
   reaches the client as 404 (`upload_incomplete`), 409 (started twice), 410 (`upload_expired`) or 400
   (`upload_rejected`).
3. The uploader sends `PATCH`es of `media.tus.chunkBytes`. After a failed request it pauses
   (`media.tus.retryDelaysMs`), asks tusd for its offset (`HEAD`) and goes on from there; progress resets the pauses,
   and it gives up when they run out. It never repeats the creation: the server admits an upload once.
4. When the last byte arrives, tusd's `post-finish` hook calls `TusHookController` again, which calls
   `MediaLibrary.finishResumableUpload`: the upload stays claimable for at least `media.uploadExpiresIn` from then,
   however much of its lifetime the transfer used (the expiry is never shortened; an upload already expired, or not a
   started tus upload, is left as it is).
5. The action claims the token as for any upload. For a tus upload the claim takes the recorded media type (tusd's
   local store keeps none), refuses as incomplete a file still short of the recorded size and keeps it (tusd's local
   store grows it in place; its S3 store shows the object only once complete), refuses a larger one, checks the bytes
   against the type, and deletes tusd's `uploads/<id>.info` with the record. The type check reads the first 64 bytes
   from the disk's `readStream` and cancels it, and the file is moved with the disk's own move, so a multi-gigabyte
   upload never sits in the service's memory: on `s3` (S3, R2, MinIO) a move above 5 GiB is a multipart copy
   (`UploadPartCopy`), on `gcs` the store's rewrite, on `local` a rename. The `encore_bucket` disk has no streamed read
   or server-side move (Encore's bucket API downloads and uploads whole), so there the claim holds the whole file in
   memory: send large tus uploads to an `s3`, `gcs` or `local` disk.

Run tusd (v2) against the media store with the hook pointed at the service:

```sh
# S3 / R2 / MinIO: the media bucket, under the uploads/ prefix the claim reads
tusd -s3-bucket acme-files -s3-object-prefix uploads/ -base-path /files/ \
  -hooks-http "https://tusd:${MEDIA_TUS_HOOK_SECRET}@api.acme.test/media/tus-hooks" \
  -hooks-enabled-events pre-create,post-finish -disable-download
# local disk: the uploads/ folder under filesystem.root
tusd -upload-dir ./storage/uploads -base-path /files/ -hooks-http ... -hooks-enabled-events pre-create,post-finish \
  -disable-download
```

The hook password is the secret `MEDIA_TUS_HOOK_SECRET`, read blind into `tusHookSecret`; while it is empty every hook
call is refused, so no tus upload starts. tusd prints its `-hooks-http` URL, password included, once at start-up:
keep tusd's own output out of shared logs. Serve downloads from the claimed path, never from tusd (`-disable-download`).

### `Upload<Bucket>` in a shape

An input field typed `Upload<ProductImagesBucket>` is gen's `upload` shape kind. Gen writes `image: Upload.schema` in
`#stackra/schemas/<module>` and, in the manifest and `openapi.json`, the token object
`{ type: "object", required: ["id"], properties: { id: <upl_ pattern> } }` with `x-stackra-type: upload` and
`x-stackra-bucket: ProductImagesBucket`. The argument must be a class that extends `Bucket({...})`; anything else is
`shape_unknown_type`. A bare `Upload` takes any bucket. The bucket in the type is documentation for clients:
`MediaLibrary.claim` still checks it at run time.

`bucket: null` (what `useUpload()` sends) takes the member's only registered bucket. A member with several buckets
names one: `useUpload({ bucket: "catalogue.product_images" })`.

A public file is served by the CDN in front of the bucket. A private file's `url` is its address, which the CDN must not
serve: allow only `public/*` there. Read a private file through `media.temporaryUrl(file, Duration.minutes(5))`.

## Image variants

```tsx
image = useImageVariant(this.props.product.image, { width: 480, format: ImageFormat.Webp });
<img src={this.image?.url} width={480} height={480} alt="" />;
// https://cdn.test/tee.jpg?w=480&format=webp
```

The URL carries `w`, `h` and `format`, which the media CDN's resizer reads. An absent image gives `undefined`. The
bucket's `variants` are recorded for gen and runway; this package does not run the resizer.

## Configuration

Runway sets `config.media` per environment. The disk, bucket, region and public base URL are `config.filesystem`'s:
media stores on the one `FileSystem` disk per region and environment (ADR 0465):

```yaml
config:
  media:
    uploader: http # memory | http | tus (an app's setting)
    uploadExpiresIn: PT1H # signed uploads, and the claim window after a tus upload finishes; at most seven days
    resumableUploadExpiresIn: P1D # a tus upload from creation, the transfer included; at most seven days
    resumableUploadEndpoint: /api/uploads/create-resumable # the tus uploader asks here
    tus: { endpoint: https://uploads.acme.test/files/, chunkBytes: 8388608, retryDelaysMs: [0, 1000, 3000, 5000, 10000] }
    scanner: guard_duty # memory | clamav | guard_duty
    clamav: { host: clamd.internal, port: 3310, maxBytes: 26214400 } # the clamav scanner only
    ocr: # the paddle_ocr text extractor only; the service in this region
      endpoint: http://ocr.ksa.internal/ocr
      languages: [ar, en] # what the deployed recognition model reads
      maxBytes: 20971520
      timeoutMs: 60000
    c2pa: { algorithm: es256, timestampUrl: "", formats: [image/jpeg, image/png, image/webp] }
  filesystem:
    disk: s3 # memory | local | s3 | gcs | encore_bucket
    url: https://cdn.acme.test
    s3:
      bucket: acme-files
      region: auto
      endpoint: https://<account>.r2.cloudflarestorage.com
```

No credential value is configuration. The disks use their SDK's default chain (see `@stackra/filesystem`). The C2PA certificate chain and
its private key (PEM) are the secrets `MEDIA_C2PA_SIGNING_CERTIFICATE` and `MEDIA_C2PA_SIGNING_KEY`, read blind from the
secret store into `c2paSigningCertificate` and `c2paSigningKey`; they are empty until the certificate is issued. The tus
hook password is the secret `MEDIA_TUS_HOOK_SECRET` (`tusHookSecret`). The bucket's CORS rule must allow `PUT`
from the app's origins with the `content-type` header. A lifecycle rule should expire `uploads/` once
`resumableUploadExpiresIn` plus `uploadExpiresIn` has passed (two days with the defaults), which removes uploads nobody
claimed and their records (and, for tus, tusd's `.info` and `.part` objects); add one that aborts incomplete multipart
uploads after the same time, which drops tus uploads nobody finished.

### Migrating from `MediaDisk` (stackra-226)

- Drop `config.media.disk`; set `config.filesystem.disk` instead (a leftover `media.disk` value is ignored).
- `MediaDisk`, `MemoryMediaDiskDriver`, `S3MediaDiskDriver`, `MediaObject`, `SignedUpload` and `UploadRequest` are
  gone. Inject `FileSystem` (`@stackra/filesystem/contracts`) and use `MemoryFileSystemDriver` in tests;
  `SignedUpload` and `UploadRequest` (without `metadata`) are `@stackra/filesystem/contracts`' now.
- Uploads signed before the change carry no `uploads/<id>.json` record, so their claim is refused as incomplete; they
  expire within `uploadExpiresIn` anyway. Ship the change between upload windows or let the client retry.

## Scanning and processing

`FileScanner` (`./contracts`) scans a stored upload before the files service hands it out: `guard_duty` reads the
`GuardDutyMalwareScanStatus` tag GuardDuty Malware Protection writes on the object (no tag yet is `pending`),
`clamav` streams the bytes to clamd (`INSTREAM`) where GuardDuty is not offered (GCP Dammam, a local stack), and
`memory` finds only the EICAR test file. Verdicts are `clean`, `infected`, `pending` and `failed`.

`FileSystem.read(path)` gives the stored bytes to server-side work (a scanner's `read`, a transform, an extraction);
a client still reads through `url` or `temporaryUrl`. A missing object is `FileNotFoundError`.

`ImageTransformer` resizes, composites and re-encodes without metadata. The `sharp` driver (`./node`) applies the EXIF
orientation, fits the image inside the box without enlarging it, then places each layer (a watermark, a personalised
name or logo rendered to a PNG) at `left`/`top` or a `gravity`, the last on top:

```ts
const card = await images.transform(await disk.read(file.path), {
  width: 600,
  format: "webp",
  quality: 80,
  layers: [{ bytes: watermark, gravity: "southeast" }],
});
```

`TextExtractor` reads text with BCP 47 language hints. The `document` driver (`./node`) reads a DOCX body and a PDF's
text layer in process, so a privileged file never leaves the region the service runs in; it reports the hints whose
script it found. A scanned PDF has no text layer and gives empty text: send it to an OCR driver.

The `paddle_ocr` driver (`./node`) is the OCR driver with Arabic: it posts an image or PDF to the self-hosted PaddleOCR
service (`POST /ocr`, PP-OCRv5 with the Arabic recognition model) at `media.ocr.endpoint`, which runway points at the
service in the same region, so a scan never leaves it. It puts the recognised boxes in logical order (rows top to
bottom, an Arabic row right to left) and refuses a language hint outside `media.ocr.languages` rather than return
garbled text. Azure Document Intelligence is a connector in OS integrations, not here.

`ContentCredentials` signs C2PA manifests on AI-generated images. The `c2pa` driver (`./node`) embeds a manifest with
one `c2pa.created` action whose IPTC digital source type is `trainedAlgorithmicMedia`, signed with the certificate from
the secret store; `read` gives the verified credential or `null`. While the certificate is not set, `attach` refuses.

**Certification pending (owner D3, 2026-10-27).** No C2PA signing certificate exists yet and no live PaddleOCR service
was called: both drivers follow the public docs (PaddleOCR 3.x serving, C2PA 2.x, c2pa-node) and their tests replay
fixtures written in those shapes. Re-record the fixtures against the deployed service and a signed image when they are
certified, after 1.0.

Nothing in this package injects the processing ports: the host binds the driver it wants. `sharp` and `document` have
no memory twin; a test runs them on in-memory bytes. The `paddle_ocr` and `c2pa` tests stub `fetch` and the c2pa engine.

## Testing

```ts
const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
const image = await fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png });
const foreign = await fakeUpload(app, null, { mediaType: MediaType.Png }); // refused as another bucket's
```

A service that injects `MediaLibrary` gets it bound over the memory `FileSystem` disk under `.useDrivers("memory")`
(STA-1297); it declares `@stackra/filesystem` beside `@stackra/media`, since media stores on its disk. Gen's
`PLATFORM_BINDINGS` row binds it with `deps: [FileSystem, MediaConfig, Clock]` (ADR 0465).

`fakeUpload` goes through `createUpload` and the memory disk's `receive`, so the bucket's rules apply as in production.
In a browser test, the `memory` uploader returns a fresh token for every file and records it in `uploads`.
