# @stackra/media

<!--
Stackra file contract:
Purpose: the reader guide of @stackra/media: buckets, the upload flow, `Upload<Bucket>` in shapes and gen's
         schema for it, variants, configuration, scanning, server-side processing (byte reads, image transforms with
         compositing, DOCX and PDF text extraction) and testing.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0222; ADR 0294 (decision 26); STA-1218 (gen's `upload` shape kind); ADR 0234 and R3-SO-13
                    (text extraction in region); STA-789.
-->

Stackra media: the `Bucket` kind, signed direct uploads that `MediaLibrary` claims into a bucket, the `MediaDisk` port
with its memory and S3/R2 drivers, the `sharp` image transformer with compositing, the in-region `document` text
extractor (DOCX and PDF), the client `Uploader` port with its memory and HTTP drivers, `MediaConfig`, the
`upload.create` action, `useUpload`, `useImageVariant` and `fakeUpload`.

**Tier:** `tier:lib` (`packages/data/media`). Entries `.`, `./contracts`, `./node`, `./react` and `./testing`. Depends
on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/actions`, `@stackra/filesystem` (the shared bucket and its public URL), zod, the AWS SDK S3 client, sharp
(libvips), unpdf (pdf.js) and fflate; React is an optional peer of `./react`.

## What is here

| Entry         | Symbol                                                                                                                 | Use                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `.`           | `Bucket`                                                                                                               | the kind base of a `models/<name>.bucket.ts` declaration                             |
| `.`           | `BucketVisibility`, `MediaType`, `ImageFormat`                                                                         | who reads a bucket; accepted types (IANA codes); variant formats                     |
| `.`           | `Upload`                                                                                                               | the token an action input takes instead of bytes; `Upload.schema` is its wire schema |
| `.`           | `MediaLibrary`                                                                                                         | `createUpload`, `claim`, `temporaryUrl`                                              |
| `.`           | `MediaConfig`, `MediaConfig$`, `MediaOptions`                                                                          | key `media`: `disk`, `uploader`, `uploadExpiresIn`, `uploadEndpoint`                 |
| `.`           | `Uploader`, `MemoryUploaderDriver`, `HttpUploaderDriver`                                                               | the client side of an upload                                                         |
| `.`           | `MemoryMediaDiskDriver`                                                                                                | `disk: memory`, with `receive` playing the store's side of a signed `PUT`            |
| `.`           | `UploadBucketMismatchError`, `UploadExpiredError`, `UploadIncompleteError`, `UploadRejectedError`, `UploadFailedError` | the refusals                                                                         |
| `.`           | `registerBuckets`                                                                                                      | how gen's entry hands over the derived bucket keys                                   |
| `./contracts` | `MediaDisk`, `SignedUpload`, `UploadRequest`, `MediaObject`                                                            | the store port (`read` gives the bytes for server-side work) and its types           |
| `./contracts` | `ImageTransformer`, `ImageTransform`, `ImageLayer`, `TextExtractor`, `ExtractedText`                                   | the processing ports and the types they speak                                        |
| `./node`      | `S3MediaDiskDriver`                                                                                                    | `disk: s3`: AWS S3, Cloudflare R2 or MinIO                                           |
| `./node`      | `SharpImageTransformerDriver`                                                                                          | `ImageTransformer` on sharp: resize, composite layers, re-encode, no metadata        |
| `./node`      | `DocumentTextExtractorDriver`                                                                                          | `TextExtractor` for DOCX and PDF text layers, in process (in region)                 |
| `./node`      | `CreateUploadAction`, `CreateUploadInput`, `CreateUploadOutput`                                                        | `media.upload.create@1`, `POST /uploads`                                             |
| `./react`     | `useUpload`, `useImageVariant`                                                                                         | upload a file; size an image                                                         |
| `./testing`   | `fakeUpload`                                                                                                           | a finished upload in a test, on the memory disk                                      |

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
2. `MediaLibrary.createUpload` checks the bucket's types and size, mints `upl_…`, and signs a `PUT` of
   `uploads/<id>`. The media type, the bucket key and the expiry are signed into the request, so the client cannot
   change them. The token carries the id only.
3. The client puts the bytes to the signed URL and sends the token to an action (`image: Upload<ProductImagesBucket>`).
4. The action calls `media.claim(input.image, ProductImagesBucket)`. The claim reads what the store received, then
   refuses in this order: nothing there (`UploadIncompleteError`), another bucket (`UploadBucketMismatchError`), past
   its expiry (`UploadExpiredError`), and a type or size the bucket does not take (`UploadRejectedError`, after deleting
   the file). Otherwise it moves the file to `<visibility>/<bucket key as folders>/<id>.<subtype>` and returns
   `{ id, bucket, path, url, mediaType, size }`. A second claim of the same token finds nothing.

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

Runway sets `config.media` per environment. The bucket, region and public base URL are `config.filesystem`'s, because
media shares the store's bucket per region and environment:

```yaml
config:
  media:
    disk: s3 # memory | s3
    uploader: http # memory | http (an app's setting)
    uploadExpiresIn: PT1H # at most seven days
    scanner: guard_duty # memory | clamav | guard_duty
    clamav: { host: clamd.internal, port: 3310, maxBytes: 26214400 } # the clamav scanner only
  filesystem:
    url: https://cdn.acme.test
    s3:
      bucket: acme-files
      region: auto
      endpoint: https://<account>.r2.cloudflarestorage.com
```

No credential is configuration. The S3 driver uses the AWS SDK's default chain. The bucket's CORS rule must allow `PUT`
from the app's origins with the `content-type` and `x-amz-meta-*` headers. A lifecycle rule should expire `uploads/`
after a day, which removes uploads nobody claimed.

## Scanning and processing

`FileScanner` (`./contracts`) scans a stored upload before the files service hands it out: `guard_duty` reads the
`GuardDutyMalwareScanStatus` tag GuardDuty Malware Protection writes on the object (no tag yet is `pending`),
`clamav` streams the bytes to clamd (`INSTREAM`) where GuardDuty is not offered (GCP Dammam, a local stack), and
`memory` finds only the EICAR test file. Verdicts are `clean`, `infected`, `pending` and `failed`.

`MediaDisk.read(path)` gives the stored bytes to server-side work (a scanner's `read`, a transform, an extraction);
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
script it found. A scanned PDF has no text layer and gives empty text: send it to an OCR driver. Arabic OCR and
`ContentCredentials` (signed C2PA manifests on AI-generated images) have no driver here yet (stackra-26).

Nothing in this package injects the processing ports: the host binds the driver it wants. `sharp` and `document` have
no memory twin; a test runs them on in-memory bytes.

## Testing

```ts
const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
const image = await fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png });
const foreign = await fakeUpload(app, null, { mediaType: MediaType.Png }); // refused as another bucket's
```

A service that injects `MediaLibrary` gets it bound by gen over the memory disk under `.useDrivers("memory")`
(STA-1297); it declares `@stackra/filesystem` beside `@stackra/media`, since the disks read `FilesystemConfig`.

`fakeUpload` goes through `createUpload` and the memory disk's `receive`, so the bucket's rules apply as in production.
In a browser test, the `memory` uploader returns a fresh token for every file and records it in `uploads`.
