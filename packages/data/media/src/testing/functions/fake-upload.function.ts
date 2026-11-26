/**
 * Stackra file contract:
 * Purpose: `fakeUpload(app, bucket, options)`, the helper a test stands in a finished signed-URL upload with: it asks
 *          the app's `MediaLibrary` for an upload into `bucket`, puts the bytes to the memory disk exactly as a browser
 *          would, and returns the token with the URL the claim will give.
 * Boundary: test code only; needs the memory `FileSystem` disk of @stackra/filesystem
 *           (`createTestingModule(...).useDrivers("memory")`; the media disk was folded into it, ADR 0465). A `null`
 *           bucket signs for a bucket no member declares, so every claim refuses the token. The upload goes through
 *           the real checks: a type or size the bucket does not take is refused here as in production.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0222 (decision 2); the template's
 *                     `fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png })`.
 */
import type { TestingApp } from "@stackra/container/testing";
import { MemoryFileSystemDriver } from "@stackra/filesystem";
import { FileSystem } from "@stackra/filesystem/contracts";

import { filePathOf } from "#core/functions/file-path-of.function";
import { type Bucket, type BucketClass, MediaLibrary, MediaType } from "#core/index";
import { ForeignBucket } from "#testing/models/foreign.bucket";
import type { FakeUpload } from "#testing/types/fake-upload.type";

/** The shortest real head of each media type, so a claim's content check accepts the fake. */
const HEADS: Readonly<Record<MediaType, readonly number[]>> = {
  [MediaType.Jpeg]: [0xff, 0xd8, 0xff, 0xe0],
  [MediaType.Png]: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  [MediaType.Webp]: [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
  [MediaType.Avif]: [0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0],
  [MediaType.Gif]: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  [MediaType.Pdf]: [0x25, 0x50, 0x44, 0x46, 0x2d],
  [MediaType.Mp4]: [0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0],
};

/**
 * A finished upload into `bucket`.
 *
 * @param options - the file's media type, and its bytes (by default the shortest real head of that type).
 * @throws TypeError when the app's `FileSystem` is not the memory disk, or the memory disk refuses the bytes.
 * @throws UploadRejectedError when the bucket does not take the media type or the size.
 * @example
 * const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
 * const image = await fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png });
 * await run(AttachProductImageAction, { productId, image, alt: null }, { as: actors.staff() });
 */
export async function fakeUpload<B extends Bucket = Bucket>(
  app: TestingApp,
  bucket: BucketClass<B> | null,
  options: { readonly mediaType: MediaType; readonly bytes?: Uint8Array },
): Promise<FakeUpload<B>> {
  const disk = app.get(FileSystem);
  if (!(disk instanceof MemoryFileSystemDriver))
    throw new TypeError(
      'fakeUpload needs the memory file system disk: compile the testing module with useDrivers("memory")',
    );
  const type: BucketClass = bucket ?? ForeignBucket;
  const bytes = options.bytes ?? new Uint8Array(HEADS[options.mediaType]);
  const pending = await app
    .get(MediaLibrary)
    .createUpload(type, { mediaType: options.mediaType, size: bytes.byteLength });
  if ((await disk.receive(pending.url, pending.headers, bytes)) !== 200)
    throw new TypeError("The memory file system disk refused the fake upload's bytes");
  return {
    id: pending.upload.id,
    url: disk.url(filePathOf(type, pending.upload.id, options.mediaType)),
  };
}
