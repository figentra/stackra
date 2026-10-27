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
import { MediaLibrary } from "#core/index";
import type { Bucket, BucketClass, MediaType } from "#core/index";
import { ForeignBucket } from "#testing/models/foreign.bucket";
import type { FakeUpload } from "#testing/types/fake-upload.type";

/**
 * A finished upload into `bucket`.
 *
 * @param options - the file's media type, and its bytes (one byte by default).
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
  const bytes = options.bytes ?? new Uint8Array([0]);
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
