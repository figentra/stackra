# @stackra/media

Stackra media: the `Bucket` kind, signed direct uploads that `MediaLibrary` claims into a bucket, the `MediaDisk` port
with its memory and S3/R2 drivers, the client `Uploader` port with its memory and HTTP drivers, `MediaConfig`, the
`upload.create` action, `useUpload`, `useImageVariant` and `fakeUpload`.

**Tier:** `tier:lib` (`packages/data/media`). Entries `.`, `./contracts`, `./node`, `./react` and `./testing`. Depends
on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/actions`, `@stackra/filesystem` (the shared bucket and its public URL), zod and the AWS SDK S3 client; React is
an optional peer of `./react`.

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
| `./contracts` | `MediaDisk`, `SignedUpload`, `UploadRequest`, `MediaObject`                                                            | the store port and the types it speaks                                               |
| `./node`      | `S3MediaDiskDriver`                                                                                                    | `disk: s3`: AWS S3, Cloudflare R2 or MinIO                                           |
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

## Testing

```ts
const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
const image = await fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png });
const foreign = await fakeUpload(app, null, { mediaType: MediaType.Png }); // refused as another bucket's
```

`fakeUpload` goes through `createUpload` and the memory disk's `receive`, so the bucket's rules apply as in production.
In a browser test, the `memory` uploader returns a fresh token for every file and records it in `uploads`.
