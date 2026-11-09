/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandAssetsBucket`: public, PNG and JPEG only, 512 KiB, the `print`, `email` and `mark`
 *          variants, registered as `branding.brand_assets`; media refuses a PDF and a
 *          file over the cap, and claims a real PNG under `public/branding/brand_assets/`.
 * Boundary: test only; the real `MediaLibrary` over the memory `FileSystem` disk, the bytes put as a browser would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decisions 1 to 4); STA-2644 (FR-002).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import {
  BucketVisibility,
  MediaConfig,
  MediaLibrary,
  MediaType,
  UploadRejectedError,
} from "@stackra/media";
import { describe, expect, it } from "@stackra/testing";

import { BrandAssetsBucket } from "#node/models/brand-assets.bucket";

/** A fixed clock. */
class TestClock extends Clock {
  /** Always the same instant. */
  now(): Date {
    return new Date("2026-11-09T09:00:00.000Z");
  }
}

/** A PNG signature: enough for media's content check. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The brand images bucket. */
describe("BrandAssetsBucket", () => {
  /** What it declares. */
  it("is public, takes PNG and JPEG up to 512 KiB, with three variants", () => {
    expect(kindOf(BrandAssetsBucket)?.options).toEqual({
      visibility: BucketVisibility.Public,
      maxBytes: 524_288,
      accept: [MediaType.Png, MediaType.Jpeg],
      variants: {
        print: { width: 600 },
        email: { width: 400 },
        mark: { width: 512, height: 512 },
      },
    });
  });

  /** Media enforces it, and stores under the registered key. */
  it("refuses other types and oversize files, and claims a PNG under its key", async () => {
    const clock = new TestClock();
    const disk = new MemoryFileSystemDriver(
      buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
      clock,
    );
    const media = new MediaLibrary(disk, buildConfig(MediaConfig), clock);
    await expect(
      media.createUpload(BrandAssetsBucket, { mediaType: MediaType.Pdf, size: 8 }),
    ).rejects.toBeInstanceOf(UploadRejectedError);
    await expect(
      media.createUpload(BrandAssetsBucket, { mediaType: MediaType.Png, size: 524_289 }),
    ).rejects.toBeInstanceOf(UploadRejectedError);
    const pending = await media.createUpload(BrandAssetsBucket, {
      mediaType: MediaType.Png,
      size: PNG.length,
    });
    expect(await disk.receive(pending.url, pending.headers, PNG)).toBe(200);
    const file = await media.claim(pending.upload, BrandAssetsBucket);
    expect(file.bucket).toBe("branding.brand_assets");
    expect(file.path).toBe(`public/branding/brand_assets/${pending.upload.id}.png`);
  });
});
