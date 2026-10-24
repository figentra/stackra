/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaLibrary`: an upload is signed with the bucket key and expiry as signed metadata, a
 *          bucket's type and size rules hold at signing and again at claim, a claim moves the file to its bucket path
 *          once, and a foreign, expired, missing, malformed or oversized upload is refused.
 * Boundary: test only; the memory disk stands in for S3 and receives the bytes as a browser's signed `PUT` would. A
 *           hand-moved clock drives expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decisions 1 to 3).
 */
import { buildConfig } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { FilesystemConfig } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { MemoryMediaDiskDriver } from "#core/drivers/memory-media-disk.driver";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { UploadBucketMismatchError } from "#core/errors/upload-bucket-mismatch.error";
import { UploadExpiredError } from "#core/errors/upload-expired.error";
import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import { registerBuckets } from "#core/functions/register-buckets.function";
import { MediaLibrary } from "#core/services/media-library.service";
import type { PendingUpload } from "#core/types/pending-upload.type";

/** A clock a test moves by hand. */
class TestClock extends Clock {
  at = new Date("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }
}

class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 10,
  accept: [MediaType.Png, MediaType.Jpeg],
}) {}

class InvoicesBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 100,
  accept: [MediaType.Pdf],
}) {}

/** A library over a memory disk serving from `https://cdn.test`. */
function setup(values: { uploadExpiresIn?: Duration } = {}) {
  const clock = new TestClock();
  const disk = new MemoryMediaDiskDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const media = new MediaLibrary(disk, buildConfig(MediaConfig, { values }), clock);
  return { clock, disk, media };
}

/** Puts `bytes` to the pending upload's signed URL as a browser would. */
async function put(
  disk: MemoryMediaDiskDriver,
  pending: PendingUpload,
  bytes = new Uint8Array(4),
): Promise<void> {
  expect(await disk.receive(pending.url, pending.headers, bytes)).toBe(200);
}

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("MediaLibrary.createUpload", () => {
  it("signs a PUT that binds the media type, the bucket key and the expiry", async () => {
    const { media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    expect(pending.upload.id).toMatch(/^upl_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(pending.method).toBe("PUT");
    expect(pending.url).toMatch(/^https:\/\/cdn\.test\/uploads\/upl_\w{26}\?signature=/);
    expect(pending.expiresAt).toEqual(new Date("2026-10-24T10:00:00.000Z"));
    expect(pending.headers).toEqual({
      "content-type": "image/png",
      "x-meta-bucket": "product_images",
      "x-meta-expires": "2026-10-24T10:00:00.000Z",
    });
  });

  it("takes the upload lifetime from MediaConfig", async () => {
    const { media } = setup({ uploadExpiresIn: Duration.minutes(15) });
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    expect(pending.expiresAt).toEqual(new Date("2026-10-24T09:15:00.000Z"));
  });

  it("refuses a media type the bucket does not take", async () => {
    const { media } = setup();
    await expect(
      media.createUpload(ProductImagesBucket, { mediaType: MediaType.Pdf, size: 4 }),
    ).rejects.toMatchObject({
      code: "upload_rejected",
      bucket: "product_images",
      reason: "media_type",
    });
  });

  it.each([0, 1.5, 11])("refuses a size of %s bytes", async (size) => {
    const { media } = setup();
    const refused = media.createUpload(ProductImagesBucket, { mediaType: MediaType.Png, size });
    await expect(refused).rejects.toBeInstanceOf(UploadRejectedError);
    await expect(refused).rejects.toMatchObject({ reason: "size" });
  });

  it("refuses a class that is not a bucket", async () => {
    const { media } = setup();
    class NotABucket {}
    await expect(
      media.createUpload(NotABucket as never, { mediaType: MediaType.Png, size: 4 }),
    ).rejects.toThrow(TypeError);
  });
});

describe("MediaLibrary.claim", () => {
  it("moves a finished upload to its bucket path and returns the file", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await put(disk, pending);

    const file = await media.claim(pending.upload, ProductImagesBucket);

    const path = `public/product_images/${pending.upload.id}.png`;
    expect(file).toEqual({
      id: pending.upload.id,
      bucket: "product_images",
      path,
      url: `https://cdn.test/${path}`,
      mediaType: MediaType.Png,
      size: 4,
    });
    expect(await disk.stat(`uploads/${pending.upload.id}`)).toBeNull();
    expect(await disk.stat(path)).toMatchObject({ size: 4, contentType: "image/png" });
  });

  it("uses the key gen registered", async () => {
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Jpeg,
      size: 4,
    });
    expect(pending.headers["x-meta-bucket"]).toBe("catalogue.product_images");
    await put(disk, pending);
    const file = await media.claim(pending.upload, ProductImagesBucket);
    expect(file.path).toBe(`public/catalogue/product_images/${pending.upload.id}.jpeg`);
    expect(file.bucket).toBe("catalogue.product_images");
  });

  it("refuses a second claim of the same token", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await put(disk, pending);
    await media.claim(pending.upload, ProductImagesBucket);
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadIncompleteError,
    );
  });

  it("refuses a token signed for another bucket and leaves the upload for its own", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(InvoicesBucket, {
      mediaType: MediaType.Pdf,
      size: 4,
    });
    await put(disk, pending);
    const foreign = media.claim(pending.upload as never, ProductImagesBucket);
    await expect(foreign).rejects.toBeInstanceOf(UploadBucketMismatchError);
    await expect(foreign).rejects.toMatchObject({ bucket: "product_images" });
    expect((await media.claim(pending.upload, InvoicesBucket)).bucket).toBe("invoices");
  });

  it("refuses a token claimed after its expiry", async () => {
    const { clock, disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await put(disk, pending);
    clock.at = new Date("2026-10-24T10:00:00.001Z");
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadExpiredError,
    );
  });

  it("refuses an upload whose bytes never arrived", async () => {
    const { media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadIncompleteError,
    );
  });

  it("refuses a malformed id without reading the store", async () => {
    const { media } = setup();
    await expect(
      media.claim({ id: "upl_../../public/x" as never }, ProductImagesBucket),
    ).rejects.toBeInstanceOf(UploadIncompleteError);
  });

  it("refuses and deletes a stored file larger than the bucket takes", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await put(disk, pending, new Uint8Array(11));
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toMatchObject({
      code: "upload_rejected",
      reason: "size",
    });
    expect(await disk.stat(`uploads/${pending.upload.id}`)).toBeNull();
  });

  it("stores a private bucket's file under private/ and links it for a while", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(InvoicesBucket, {
      mediaType: MediaType.Pdf,
      size: 4,
    });
    await put(disk, pending);
    const file = await media.claim(pending.upload, InvoicesBucket);
    expect(file.path).toBe(`private/invoices/${pending.upload.id}.pdf`);
    expect(await media.temporaryUrl(file, Duration.minutes(5))).toBe(
      `${file.url}?expires=2026-10-24T09%3A05%3A00.000Z`,
    );
  });
});
