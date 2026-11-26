/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaLibrary` over a `FileSystem` disk (ADR 0465): an upload is signed with its media type
 *          and its bucket key and expiry are recorded beside it, a bucket's type and size rules hold at signing and
 *          again at claim, a claim moves the file to its bucket path once and drops the record, a disk that cannot sign
 *          refuses, and a foreign, expired, missing, malformed or oversized upload, or one whose bytes are not its
 *          declared type, is refused; `store` writes the server's bytes under the same rules and refuses each break. A
 *          tus upload records its media type and size, lives `resumableUploadExpiresIn` (a transfer longer than
 *          `uploadExpiresIn` is still claimed), is admitted to the tus server once with exactly that size, stays
 *          claimable `uploadExpiresIn` after the tus server reports it finished (never shortened), is claimed with the
 *          recorded type, kept while still short of its size, refused when larger, and its tus `.info` file is dropped
 *          with the record. A claim reads only the first 64 bytes of the file, from its stream, never the whole file.
 * Boundary: test only; the memory `FileSystem` disk stands in for S3 and receives the bytes as a browser's signed `PUT`
 *           would, and the bytes and `.info` file a tus server (tusd) writes beside the record. A hand-moved clock
 *           drives expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decisions 1 to 3).
 */
import { buildConfig } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { FileRetainedError, FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
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
function setup(values: { uploadExpiresIn?: Duration; resumableUploadExpiresIn?: Duration } = {}) {
  const clock = new TestClock();
  const disk = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const media = new MediaLibrary(disk, buildConfig(MediaConfig, { values }), clock);
  return { clock, disk, media };
}

/** The first bytes of a real file of each media type these tests upload. */
const HEADS: Readonly<Record<string, readonly number[]>> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0],
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
};

/** Puts `bytes` (by default a real head of the signed media type) to the pending upload's signed URL as a browser would. */
async function put(
  disk: MemoryFileSystemDriver,
  pending: PendingUpload,
  bytes = new Uint8Array(HEADS[pending.headers["content-type"] ?? ""] ?? [0, 0, 0, 0]),
): Promise<void> {
  expect(await disk.receive(pending.url, pending.headers, bytes)).toBe(200);
}

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("MediaLibrary.createUpload", () => {
  it("signs a PUT that binds the media type and records the bucket key and the expiry", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    expect(pending.upload.id).toMatch(/^upl_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(pending.method).toBe("PUT");
    expect(pending.url).toMatch(/^https:\/\/cdn\.test\/uploads\/upl_\w{26}\?signature=/);
    expect(pending.expiresAt).toEqual(new Date("2026-10-24T10:00:00.000Z"));
    expect(pending.headers).toEqual({ "content-type": "image/png" });
    const record = await disk.read(`uploads/${pending.upload.id}.json`);
    expect(JSON.parse(new TextDecoder().decode(record))).toEqual({
      bucket: "product_images",
      expires: "2026-10-24T10:00:00.000Z",
    });
  });

  it("refuses on a disk that cannot sign uploads, and records nothing", async () => {
    const { disk, clock } = setup();
    class UnsignedDisk extends MemoryFileSystemDriver {
      override async signUpload(): Promise<never> {
        throw new TypeError("This disk cannot sign uploads");
      }
    }
    const unsigned = new UnsignedDisk(buildConfig(FilesystemConfig), clock);
    const media = new MediaLibrary(unsigned, buildConfig(MediaConfig), clock);
    await expect(
      media.createUpload(ProductImagesBucket, { mediaType: MediaType.Png, size: 4 }),
    ).rejects.toThrow(TypeError);
    expect(await unsigned.list("uploads/")).toEqual([]);
    expect(await disk.list("uploads/")).toEqual([]);
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
      size: 8,
    });
    expect(await disk.list("uploads/")).toEqual([]);
    expect(await disk.stat(path)).toMatchObject({ size: 8, contentType: "image/png" });
  });

  it("uses the key gen registered", async () => {
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Jpeg,
      size: 4,
    });
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
    expect(await disk.list("uploads/")).toEqual([]);
  });

  it("refuses an upload whose record is not readable", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await put(disk, pending);
    await disk.write(`uploads/${pending.upload.id}.json`, "not json");
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadIncompleteError,
    );
  });

  it("refuses a file stored with a media type the bucket does not take", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    // an Encore bucket signs no header, so the store keeps whatever type the client sent
    await disk.write(`uploads/${pending.upload.id}`, new Uint8Array(4), {
      contentType: "application/pdf",
    });
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toMatchObject({
      code: "upload_rejected",
      reason: "media_type",
    });
    expect(await disk.list("uploads/")).toEqual([]);
  });

  it("refuses and deletes a file whose bytes are not the media type it declared", async () => {
    const { disk, media } = setup();
    const pending = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    // an SVG renamed to a PNG: the store keeps the signed type, the bytes say otherwise
    await put(disk, pending, new TextEncoder().encode("<svg/>"));
    await expect(media.claim(pending.upload, ProductImagesBucket)).rejects.toMatchObject({
      code: "upload_rejected",
      reason: "content",
    });
    expect(await disk.list("uploads/")).toEqual([]);
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

describe("MediaLibrary.store", () => {
  it("stores the server's bytes as a file of the bucket and returns it", async () => {
    const { disk, media } = setup();
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

    const file = await media.store(InvoicesBucket, pdf, MediaType.Pdf);

    expect(file.path).toBe(`private/invoices/${file.id}.pdf`);
    expect(file).toMatchObject({ bucket: "invoices", mediaType: MediaType.Pdf, size: 8 });
    expect(await disk.read(file.path)).toEqual(pdf);
    expect(await disk.stat(file.path)).toMatchObject({ contentType: "application/pdf" });
  });

  it("keeps a stored file unchangeable until its retention ends", async () => {
    const { disk, media } = setup();
    const retainUntil = new Date("2032-11-09T10:30:00Z");

    const file = await media.store(
      InvoicesBucket,
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      MediaType.Pdf,
      { retainUntil },
    );

    await expect(disk.delete(file.path)).rejects.toBeInstanceOf(FileRetainedError);
    expect(await disk.exists(file.path)).toBe(true);
  });

  it("refuses a media type the bucket does not take, and writes nothing", async () => {
    const { disk, media } = setup();

    await expect(
      media.store(InvoicesBucket, new Uint8Array([0x89, 0x50, 0x4e, 0x47]), MediaType.Png),
    ).rejects.toMatchObject({ code: "upload_rejected", reason: "media_type" });
    expect(await disk.list("private/")).toEqual([]);
  });

  it("refuses empty and oversized bytes, and writes nothing", async () => {
    const { disk, media } = setup();

    await expect(
      media.store(InvoicesBucket, new Uint8Array(0), MediaType.Pdf),
    ).rejects.toMatchObject({
      reason: "size",
    });
    await expect(
      media.store(InvoicesBucket, new Uint8Array(101).fill(0x25), MediaType.Pdf),
    ).rejects.toMatchObject({ reason: "size" });
    expect(await disk.list("private/")).toEqual([]);
  });

  it("refuses bytes that are not the declared type, and writes nothing", async () => {
    const { disk, media } = setup();

    await expect(
      media.store(InvoicesBucket, new TextEncoder().encode("<html></html>"), MediaType.Pdf),
    ).rejects.toMatchObject({ reason: "content" });
    expect(await disk.list("private/")).toEqual([]);
  });
});

/** Writes `bytes` (by default a PNG head) and a tus `.info` file for the tus upload `id`, as tusd does on finishing it. */
async function tusWrite(
  disk: MemoryFileSystemDriver,
  id: string,
  bytes = new Uint8Array(HEADS["image/png"] ?? []),
): Promise<void> {
  await disk.write(`uploads/${id}`, bytes, { contentType: "application/octet-stream" });
  await disk.write(`uploads/${id}.info`, "{}", { contentType: "application/json" });
}

describe("MediaLibrary.createResumableUpload", () => {
  it("records the bucket, media type, size and expiry and answers how to start the tus upload", async () => {
    const { disk, media } = setup();
    const resumable = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    const id = resumable.upload.id;
    expect(id).toMatch(/^upl_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(resumable.url).toBe("/files/");
    expect(resumable.headers).toEqual({
      "tus-resumable": "1.0.0",
      "upload-metadata": `upload ${btoa(id)}`,
    });
    expect(resumable.expiresAt).toEqual(new Date("2026-10-25T09:00:00.000Z"));
    const record = await disk.read(`uploads/${id}.json`);
    expect(JSON.parse(new TextDecoder().decode(record))).toEqual({
      bucket: "product_images",
      expires: "2026-10-25T09:00:00.000Z",
      transfer: "tus",
      mediaType: "image/png",
      size: 8,
      started: false,
    });
  });

  it("works on a disk that cannot sign uploads: nothing is signed", async () => {
    const { clock } = setup();
    class UnsignedDisk extends MemoryFileSystemDriver {
      override async signUpload(): Promise<never> {
        throw new TypeError("This disk cannot sign uploads");
      }
    }
    const unsigned = new UnsignedDisk(buildConfig(FilesystemConfig), clock);
    const media = new MediaLibrary(unsigned, buildConfig(MediaConfig), clock);
    const resumable = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    expect(await unsigned.list("uploads/")).toEqual([`uploads/${resumable.upload.id}.json`]);
  });

  it("takes its lifetime from resumableUploadExpiresIn, not the signed-URL lifetime", async () => {
    const { media } = setup({
      uploadExpiresIn: Duration.minutes(5),
      resumableUploadExpiresIn: Duration.hours(6),
    });
    const resumable = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    expect(resumable.expiresAt).toEqual(new Date("2026-10-24T15:00:00.000Z"));
  });

  it("names the configured tus server", async () => {
    const clock = new TestClock();
    const disk = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), clock);
    const media = new MediaLibrary(
      disk,
      buildConfig(MediaConfig, {
        values: {
          tus: { endpoint: "https://uploads.test/files/", chunkBytes: 1024, retryDelaysMs: [] },
        },
      }),
      clock,
    );
    const resumable = await media.createResumableUpload(InvoicesBucket, {
      mediaType: MediaType.Pdf,
      size: 50,
    });
    expect(resumable.url).toBe("https://uploads.test/files/");
  });

  it("refuses a media type or size the bucket does not take, and records nothing", async () => {
    const { disk, media } = setup();
    await expect(
      media.createResumableUpload(ProductImagesBucket, { mediaType: MediaType.Pdf, size: 4 }),
    ).rejects.toMatchObject({ code: "upload_rejected", reason: "media_type" });
    for (const size of [0, 1.5, 11])
      // oxlint-disable-next-line no-await-in-loop -- each size is its own refusal
      await expect(
        media.createResumableUpload(ProductImagesBucket, { mediaType: MediaType.Png, size }),
      ).rejects.toMatchObject({ code: "upload_rejected", reason: "size" });
    expect(await disk.list("uploads/")).toEqual([]);
  });
});

describe("MediaLibrary.admitResumableUpload", () => {
  it("admits the tus upload once, with the id and media type of its record", async () => {
    const { disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    expect(await media.admitResumableUpload(upload.id, 8)).toEqual({
      id: upload.id,
      mediaType: MediaType.Png,
    });
    const record = JSON.parse(
      new TextDecoder().decode(await disk.read(`uploads/${upload.id}.json`)),
    );
    expect(record.started).toBe(true);
    await expect(media.admitResumableUpload(upload.id, 8)).rejects.toMatchObject({
      code: "upload_rejected",
      bucket: "product_images",
      reason: "started",
    });
  });

  it.each([7, 9, null])(
    "refuses a start with a size of %s, and leaves it to start right",
    async (size) => {
      const { media } = setup();
      const { upload } = await media.createResumableUpload(ProductImagesBucket, {
        mediaType: MediaType.Png,
        size: 8,
      });
      await expect(media.admitResumableUpload(upload.id, size)).rejects.toMatchObject({
        code: "upload_rejected",
        reason: "size",
      });
      expect((await media.admitResumableUpload(upload.id, 8)).id).toBe(upload.id);
    },
  );

  it("refuses an id that is not a waiting tus upload", async () => {
    const { media } = setup();
    const signed = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    for (const id of [
      "",
      "../uploads/x",
      "upl_../../public/x",
      "upl_01jb3m0000000000000000000a",
      signed.upload.id,
    ])
      // oxlint-disable-next-line no-await-in-loop -- each id is its own refusal
      await expect(media.admitResumableUpload(id, 4)).rejects.toBeInstanceOf(UploadIncompleteError);
  });

  it("refuses a tus upload whose lifetime has passed", async () => {
    const { clock, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    clock.at = new Date("2026-10-25T09:00:00.001Z");
    await expect(media.admitResumableUpload(upload.id, 8)).rejects.toBeInstanceOf(
      UploadExpiredError,
    );
  });

  it("refuses a record that names a media type it does not know", async () => {
    const { disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    const path = `uploads/${upload.id}.json`;
    const record = JSON.parse(new TextDecoder().decode(await disk.read(path)));
    await disk.write(path, JSON.stringify({ ...record, mediaType: "image/svg+xml" }));
    await expect(media.admitResumableUpload(upload.id, 8)).rejects.toBeInstanceOf(
      UploadIncompleteError,
    );
  });
});

/** The expiry recorded for the upload `id`. */
const expiresOf = async (disk: MemoryFileSystemDriver, id: string): Promise<string> =>
  JSON.parse(new TextDecoder().decode(await disk.read(`uploads/${id}.json`))).expires;

describe("MediaLibrary.finishResumableUpload", () => {
  it("keeps an upload that finished late in its lifetime claimable for uploadExpiresIn after its last byte", async () => {
    const { clock, disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await media.admitResumableUpload(upload.id, 8);
    clock.at = new Date("2026-10-25T08:30:00.000Z");
    await tusWrite(disk, upload.id);
    await media.finishResumableUpload(upload.id);
    expect(await expiresOf(disk, upload.id)).toBe("2026-10-25T09:30:00.000Z");

    clock.at = new Date("2026-10-25T09:20:00.000Z");
    expect((await media.claim(upload, ProductImagesBucket)).size).toBe(8);
  });

  it("never shortens the expiry of an upload that finished early", async () => {
    const { clock, disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await media.admitResumableUpload(upload.id, 8);
    clock.at = new Date("2026-10-24T09:10:00.000Z");
    await media.finishResumableUpload(upload.id);
    expect(await expiresOf(disk, upload.id)).toBe("2026-10-25T09:00:00.000Z");
  });

  it("refuses an id that is not a tus upload the tus server started", async () => {
    const { media } = setup();
    const signed = await media.createUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    const { upload: unstarted } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    for (const id of [
      "",
      "../uploads/x",
      "upl_01jb3m0000000000000000000a",
      signed.upload.id,
      unstarted.id,
    ])
      // oxlint-disable-next-line no-await-in-loop -- each id is its own refusal
      await expect(media.finishResumableUpload(id)).rejects.toBeInstanceOf(UploadIncompleteError);
  });

  it("refuses an upload whose lifetime passed before it finished, and leaves it expired", async () => {
    const { clock, disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await media.admitResumableUpload(upload.id, 8);
    clock.at = new Date("2026-10-25T09:00:00.001Z");
    await expect(media.finishResumableUpload(upload.id)).rejects.toBeInstanceOf(UploadExpiredError);
    expect(await expiresOf(disk, upload.id)).toBe("2026-10-25T09:00:00.000Z");
  });
});

describe("MediaLibrary.claim of a tus upload", () => {
  it("claims it with the recorded media type and drops the record and the .info file", async () => {
    const { disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await media.admitResumableUpload(upload.id, 8);
    await tusWrite(disk, upload.id);

    const file = await media.claim(upload, ProductImagesBucket);

    const path = `public/product_images/${upload.id}.png`;
    expect(file).toMatchObject({ id: upload.id, path, mediaType: MediaType.Png, size: 8 });
    expect(await disk.list("uploads/")).toEqual([]);
    expect(await disk.stat(path)).toMatchObject({ size: 8 });
  });

  it("claims a transfer that outlived the signed-URL lifetime (uploadExpiresIn)", async () => {
    const { clock, disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await media.admitResumableUpload(upload.id, 8);
    // three hours of pauses and resumes: three times uploadExpiresIn (PT1H)
    clock.at = new Date("2026-10-24T12:00:00.000Z");
    await tusWrite(disk, upload.id);
    expect((await media.claim(upload, ProductImagesBucket)).size).toBe(8);
  });

  it("reads only the first 64 bytes of the file, from its stream, never the whole file", async () => {
    const clock = new TestClock();
    /** A disk that streams in 16-byte chunks, counts what was pulled, and refuses to read an upload whole. */
    class StreamingDisk extends MemoryFileSystemDriver {
      pulled = 0;

      cancelled = false;

      override async read(path: string): Promise<Uint8Array> {
        if (!path.endsWith(".json")) throw new Error(`read the whole of ${path}`);
        return super.read(path);
      }

      override async readStream(path: string): Promise<ReadableStream<Uint8Array>> {
        const bytes = await super.read(path);
        return new ReadableStream<Uint8Array>(
          {
            pull: (controller) => {
              if (this.pulled >= bytes.byteLength) return controller.close();
              const chunk = bytes.slice(this.pulled, this.pulled + 16);
              this.pulled += chunk.byteLength;
              controller.enqueue(chunk);
            },
            cancel: () => {
              this.cancelled = true;
            },
          },
          { highWaterMark: 0 },
        );
      }
    }
    const disk = new StreamingDisk(buildConfig(FilesystemConfig), clock);
    const media = new MediaLibrary(disk, buildConfig(MediaConfig), clock);
    const { upload } = await media.createResumableUpload(InvoicesBucket, {
      mediaType: MediaType.Pdf,
      size: 100,
    });
    await media.admitResumableUpload(upload.id, 100);
    const pdf = new Uint8Array(100);
    pdf.set(HEADS["application/pdf"] ?? []);
    await tusWrite(disk, upload.id, pdf);

    const file = await media.claim(upload, InvoicesBucket);

    expect(file).toMatchObject({ mediaType: MediaType.Pdf, size: 100 });
    expect(disk.pulled).toBe(64);
    expect(disk.cancelled).toBe(true);
  });

  it("keeps an upload still short of its size and claims it once complete", async () => {
    const { disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await media.admitResumableUpload(upload.id, 8);
    await tusWrite(disk, upload.id, new Uint8Array((HEADS["image/png"] ?? []).slice(0, 5)));
    await expect(media.claim(upload, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadIncompleteError,
    );
    expect(await disk.list("uploads/")).toHaveLength(3);

    await tusWrite(disk, upload.id);
    expect((await media.claim(upload, ProductImagesBucket)).size).toBe(8);
  });

  it("refuses and deletes an upload larger than its recorded size", async () => {
    const { disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await tusWrite(disk, upload.id, new Uint8Array([...(HEADS["image/png"] ?? []), 0]));
    await expect(media.claim(upload, ProductImagesBucket)).rejects.toMatchObject({
      code: "upload_rejected",
      reason: "size",
    });
    expect(await disk.list("uploads/")).toEqual([]);
  });

  it("refuses and deletes an upload whose bytes are not the recorded media type", async () => {
    const { disk, media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 4,
    });
    await tusWrite(disk, upload.id, new Uint8Array(HEADS["image/jpeg"] ?? []));
    await expect(media.claim(upload, ProductImagesBucket)).rejects.toMatchObject({
      code: "upload_rejected",
      reason: "content",
    });
    expect(await disk.list("uploads/")).toEqual([]);
  });

  it("refuses a tus upload whose bytes never arrived", async () => {
    const { media } = setup();
    const { upload } = await media.createResumableUpload(ProductImagesBucket, {
      mediaType: MediaType.Png,
      size: 8,
    });
    await expect(media.claim(upload, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadIncompleteError,
    );
  });
});
