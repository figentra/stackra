/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaLibrary` over a `FileSystem` disk (ADR 0465): an upload is signed with its media type
 *          and its bucket key and expiry are recorded beside it, a bucket's type and size rules hold at signing and
 *          again at claim, a claim moves the file to its bucket path once and drops the record, a disk that cannot sign
 *          refuses, and a foreign, expired, missing, malformed or oversized upload, or one whose bytes are not its
 *          declared type, is refused; `store` writes the server's bytes under the same rules and refuses each break.
 *          The scan gate (ADR 0222): claim and store place a file only after the scanner called it clean where it
 *          waits under `uploads/`; an infected or unscannable file is deleted and refused, a pending verdict keeps the
 *          upload for a later claim (store's retention included), an unreachable scanner keeps the upload, and
 *          `temporaryUrl` links only a clean record, scanning one without a verdict first.
 * Boundary: test only; the memory `FileSystem` disk stands in for S3 and receives the bytes as a browser's signed `PUT`
 *           would. A hand-moved clock drives expiry. The memory scanner finds the EICAR test file; a scripted scanner
 *           answers the verdicts a test needs (GuardDuty's `pending`, `failed`, an unreachable scanner).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decisions 1 to 3).
 */
import { buildConfig } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { FileRetainedError, FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { FileScanner } from "#contracts/ports/file-scanner.port";
import type { ScanResult } from "#contracts/types/scan-result.type";
import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { MemoryFileScannerDriver } from "#core/drivers/memory-file-scanner.driver";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { FileBlockedError } from "#core/errors/file-blocked.error";
import { ScanPendingError } from "#core/errors/scan-pending.error";
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

/**
 * A scanner that answers the verdict a test sets (`null` throws, as an unreachable scanner does), and records each
 * call with the bytes it read and what the bucket paths held at that moment.
 */
class ScriptedScanner extends FileScanner {
  readonly calls: { path: string; bytes: Uint8Array; placed: string[] }[] = [];

  verdict: ScanVerdict | null = ScanVerdict.Clean;

  /** Runs while the scan is in flight (a client's second PUT, say). */
  during: () => Promise<void> = async () => {};

  constructor(private readonly disk: MemoryFileSystemDriver) {
    super();
  }

  async scan(path: string, read: () => Promise<Uint8Array>): Promise<ScanResult> {
    const placed = [...(await this.disk.list("public/")), ...(await this.disk.list("private/"))];
    this.calls.push({ path, bytes: await read(), placed });
    await this.during();
    if (this.verdict === null) throw new Error("connect ECONNREFUSED 127.0.0.1:3310");
    return { verdict: this.verdict, threats: [] };
  }
}

/** A library over a memory disk serving from `https://cdn.test`, scanned by the memory (EICAR) scanner. */
function setup(values: { uploadExpiresIn?: Duration } = {}) {
  const clock = new TestClock();
  const disk = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const media = new MediaLibrary(
    disk,
    buildConfig(MediaConfig, { values }),
    clock,
    new MemoryFileScannerDriver(),
  );
  return { clock, disk, media };
}

/** A library over a memory disk scanned by a scripted scanner. */
function scripted() {
  const clock = new TestClock();
  const disk = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const scanner = new ScriptedScanner(disk);
  const media = new MediaLibrary(disk, buildConfig(MediaConfig), clock, scanner);
  return { clock, disk, media, scanner };
}

/**
 * A PDF head followed by the EICAR anti-malware test string, which the memory scanner finds anywhere (clamd needs it in a
 * PDF stream: the int test's fixture).
 */
const EICAR_PDF = new TextEncoder().encode(
  "%PDF-X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
);

/** A real PDF head. */
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

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
    const media = new MediaLibrary(
      unsigned,
      buildConfig(MediaConfig),
      clock,
      new MemoryFileScannerDriver(),
    );
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
      scan: ScanVerdict.Clean,
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
    const pdf = PDF;

    const file = await media.store(InvoicesBucket, pdf, MediaType.Pdf);

    expect(file.path).toBe(`private/invoices/${file.id}.pdf`);
    expect(file).toMatchObject({
      bucket: "invoices",
      mediaType: MediaType.Pdf,
      size: 8,
      scan: ScanVerdict.Clean,
    });
    expect(await disk.list("uploads/")).toEqual([]);
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

/** An upload into the invoices bucket whose bytes have arrived. */
async function uploaded(
  disk: MemoryFileSystemDriver,
  media: MediaLibrary,
  bytes: Uint8Array<ArrayBuffer> = PDF,
): Promise<PendingUpload<InvoicesBucket>> {
  const pending = await media.createUpload(InvoicesBucket, {
    mediaType: MediaType.Pdf,
    size: bytes.byteLength,
  });
  await put(disk, pending, bytes);
  return pending;
}

describe("MediaLibrary scan gate (ADR 0222)", () => {
  describe("claim", () => {
    it("scans the staged upload with its bytes before anything reaches a bucket path", async () => {
      const { disk, media, scanner } = scripted();
      const pending = await uploaded(disk, media);

      const file = await media.claim(pending.upload, InvoicesBucket);

      expect(scanner.calls).toEqual([
        { path: `uploads/${pending.upload.id}`, bytes: PDF, placed: [] },
      ]);
      expect(file.scan).toBe(ScanVerdict.Clean);
      expect(await disk.exists(file.path)).toBe(true);
    });

    it("places the bytes it scanned, not ones put again while the scan ran", async () => {
      const { disk, media, scanner } = scripted();
      const pending = await uploaded(disk, media);
      scanner.during = async () => {
        await put(disk, pending, EICAR_PDF);
      };

      const file = await media.claim(pending.upload, InvoicesBucket);

      expect(await disk.read(file.path)).toEqual(PDF);
      expect(await disk.list("uploads/")).toEqual([]);
    });

    it("refuses and deletes an infected upload, and never places it", async () => {
      const { disk, media } = setup();
      const pending = await uploaded(disk, media, EICAR_PDF);

      const refused = media.claim(pending.upload, InvoicesBucket);

      await expect(refused).rejects.toBeInstanceOf(UploadRejectedError);
      await expect(refused).rejects.toMatchObject({ bucket: "invoices", reason: "malware" });
      expect(await disk.list("")).toEqual([]);
      await expect(media.claim(pending.upload, InvoicesBucket)).rejects.toBeInstanceOf(
        UploadIncompleteError,
      );
    });

    it("refuses and deletes an upload the scanner cannot scan", async () => {
      const { disk, media, scanner } = scripted();
      scanner.verdict = ScanVerdict.Failed;
      const pending = await uploaded(disk, media);

      await expect(media.claim(pending.upload, InvoicesBucket)).rejects.toMatchObject({
        code: "upload_rejected",
        reason: "unscannable",
      });
      expect(await disk.list("")).toEqual([]);
    });

    it("keeps a pending upload unplaced and claims it once the scanner calls it clean", async () => {
      const { disk, media, scanner } = scripted();
      scanner.verdict = ScanVerdict.Pending;
      const pending = await uploaded(disk, media);

      const waiting = media.claim(pending.upload, InvoicesBucket);

      await expect(waiting).rejects.toBeInstanceOf(ScanPendingError);
      await expect(waiting).rejects.toMatchObject({ upload: pending.upload.id, retryable: true });
      expect(await disk.list("private/")).toEqual([]);
      expect((await disk.list("uploads/")).sort()).toEqual(
        [`uploads/${pending.upload.id}`, `uploads/${pending.upload.id}.json`].sort(),
      );

      scanner.verdict = ScanVerdict.Clean;
      const file = await media.claim(pending.upload, InvoicesBucket);
      expect(file.path).toBe(`private/invoices/${pending.upload.id}.pdf`);
      expect(await disk.list("uploads/")).toEqual([]);
    });

    it("keeps the upload when the scanner cannot be reached", async () => {
      const { disk, media, scanner } = scripted();
      scanner.verdict = null;
      const pending = await uploaded(disk, media);

      await expect(media.claim(pending.upload, InvoicesBucket)).rejects.toThrow("ECONNREFUSED");
      expect(await disk.list("private/")).toEqual([]);

      scanner.verdict = ScanVerdict.Clean;
      expect((await media.claim(pending.upload, InvoicesBucket)).scan).toBe(ScanVerdict.Clean);
    });
  });

  describe("store", () => {
    it("scans the bytes where they wait under uploads/ before writing the bucket path", async () => {
      const { disk, media, scanner } = scripted();

      const file = await media.store(InvoicesBucket, PDF, MediaType.Pdf);

      expect(scanner.calls).toEqual([{ path: `uploads/${file.id}`, bytes: PDF, placed: [] }]);
      expect(await disk.list("")).toEqual([file.path]);
    });

    it("refuses infected bytes and keeps nothing", async () => {
      const { disk, media } = setup();

      await expect(media.store(InvoicesBucket, EICAR_PDF, MediaType.Pdf)).rejects.toMatchObject({
        code: "upload_rejected",
        reason: "malware",
      });
      expect(await disk.list("")).toEqual([]);
    });

    it("refuses bytes the scanner cannot scan and keeps nothing", async () => {
      const { disk, media, scanner } = scripted();
      scanner.verdict = ScanVerdict.Failed;

      await expect(media.store(InvoicesBucket, PDF, MediaType.Pdf)).rejects.toMatchObject({
        reason: "unscannable",
      });
      expect(await disk.list("")).toEqual([]);
    });

    it("keeps nothing when the scanner cannot be reached", async () => {
      const { disk, media, scanner } = scripted();
      scanner.verdict = null;

      await expect(media.store(InvoicesBucket, PDF, MediaType.Pdf)).rejects.toThrow("ECONNREFUSED");
      expect(await disk.list("")).toEqual([]);
    });

    it("stages pending bytes as an upload that a later claim places with their retention", async () => {
      const { disk, media, scanner } = scripted();
      scanner.verdict = ScanVerdict.Pending;
      const retainUntil = new Date("2032-11-09T10:30:00.000Z");

      const staging = media.store(InvoicesBucket, PDF, MediaType.Pdf, { retainUntil });

      await expect(staging).rejects.toBeInstanceOf(ScanPendingError);
      const id = (await disk.list("uploads/")).find((path) => !path.endsWith(".json"));
      await expect(staging).rejects.toMatchObject({ upload: id?.slice("uploads/".length) });
      const upload = {
        id: id?.slice("uploads/".length),
      } as PendingUpload<InvoicesBucket>["upload"];
      expect(await disk.list("private/")).toEqual([]);
      const record = JSON.parse(
        new TextDecoder().decode(await disk.read(`uploads/${upload.id}.json`)),
      );
      expect(record).toEqual({
        bucket: "invoices",
        expires: "2026-10-24T10:00:00.000Z",
        retainUntil: "2032-11-09T10:30:00.000Z",
      });

      await expect(media.claim(upload, InvoicesBucket)).rejects.toBeInstanceOf(ScanPendingError);
      scanner.verdict = ScanVerdict.Clean;
      const file = await media.claim(upload, InvoicesBucket);

      expect(file).toMatchObject({
        path: `private/invoices/${upload.id}.pdf`,
        scan: ScanVerdict.Clean,
      });
      expect(await disk.read(file.path)).toEqual(PDF);
      expect(await disk.list("uploads/")).toEqual([]);
      await expect(disk.delete(file.path)).rejects.toBeInstanceOf(FileRetainedError);
    });
  });

  describe("temporaryUrl", () => {
    it("links a clean record without scanning it again", async () => {
      const { disk, media, scanner } = scripted();
      const file = await media.store(InvoicesBucket, PDF, MediaType.Pdf);
      scanner.calls.length = 0;
      scanner.verdict = null;

      expect(await media.temporaryUrl(file, Duration.minutes(5))).toBe(
        `${disk.url(file.path)}?expires=2026-10-24T09%3A05%3A00.000Z`,
      );
      expect(scanner.calls).toEqual([]);
    });

    it("scans a record made before the gate and links it when clean", async () => {
      const { disk, media, scanner } = scripted();
      const path = "private/invoices/upl_01jd8x0000000000000000000a.pdf";
      await disk.write(path, PDF, { contentType: "application/pdf" });

      const url = await media.temporaryUrl(
        { id: "upl_01jd8x0000000000000000000a" as never, path },
        Duration.minutes(5),
      );

      expect(url).toBe(`${disk.url(path)}?expires=2026-10-24T09%3A05%3A00.000Z`);
      expect(scanner.calls.map(({ path: scanned, bytes }) => ({ scanned, bytes }))).toEqual([
        { scanned: path, bytes: PDF },
      ]);
    });

    it("refuses an infected file recorded before the gate, and leaves it in place", async () => {
      const { disk, media } = setup();
      const path = "private/invoices/upl_01jd8x0000000000000000000a.pdf";
      await disk.write(path, EICAR_PDF, { contentType: "application/pdf" });

      const refused = media.temporaryUrl(
        { id: "upl_01jd8x0000000000000000000a" as never, path },
        Duration.minutes(5),
      );

      await expect(refused).rejects.toBeInstanceOf(FileBlockedError);
      await expect(refused).rejects.toMatchObject({ code: "file_blocked", reason: "malware" });
      expect(await disk.exists(path)).toBe(true);
    });

    it.each([
      [ScanVerdict.Pending, ScanPendingError, { code: "scan_pending" }],
      [ScanVerdict.Failed, FileBlockedError, { reason: "unscannable" }],
      [ScanVerdict.Infected, FileBlockedError, { reason: "malware" }],
    ])(
      "refuses a record that is not clean while the scanner says %s",
      async (verdict, type, fields) => {
        const { disk, media, scanner } = scripted();
        const file = await media.store(InvoicesBucket, PDF, MediaType.Pdf);
        scanner.verdict = verdict;

        const refused = media.temporaryUrl(
          { ...file, scan: ScanVerdict.Pending },
          Duration.minutes(5),
        );

        await expect(refused).rejects.toBeInstanceOf(type);
        await expect(refused).rejects.toMatchObject(fields);
        expect(await disk.exists(file.path)).toBe(true);
      },
    );
  });
});
