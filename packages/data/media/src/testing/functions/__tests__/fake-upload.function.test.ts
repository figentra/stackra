/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeUpload`: the template's two cases (a fake upload the claim accepts at the URL it
 *          predicted, and a `null`-bucket token the claim refuses as foreign), the bucket's rules still applying, the
 *          given bytes, and a refused non-memory disk.
 * Boundary: test only; a container binds a memory disk and a `MediaLibrary`, wrapped in a `TestingApp`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0222 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { TestingApp } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig } from "@stackra/filesystem";
import { describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { MediaDisk } from "#contracts/index";
import {
  Bucket,
  BucketVisibility,
  MediaLibrary,
  MediaType,
  MemoryMediaDiskDriver,
  UploadBucketMismatchError,
  UploadRejectedError,
} from "#core/index";
import { fakeUpload } from "#testing/functions/fake-upload.function";

/** Always 2026-10-24T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00.000Z");
  }
}

/** The template's product images. */
class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 5_000_000,
  accept: [MediaType.Jpeg, MediaType.Png, MediaType.Webp],
}) {}

/** A testing app over a memory disk serving from `https://cdn.test`, or over `disk` when given. */
async function compile(disk?: MediaDisk) {
  const clock = new FixedClock();
  const memory = new MemoryMediaDiskDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const media = new MediaLibrary(memory, buildConfig(MediaConfig), clock);
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [MediaDisk, disk ?? memory],
      [MediaLibrary, media],
    ]),
  });
  return { app: new TestingApp(container, []), media, memory };
}

describe("fakeUpload", () => {
  it("fakes a finished upload that the claim accepts at the predicted URL", async () => {
    const { app, media } = await compile();
    const image = await fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png });
    const file = await media.claim(image, ProductImagesBucket);
    expect(file.url).toBe(image.url);
    expect(image.url).toBe(`https://cdn.test/public/product_images/${image.id}.png`);
  });

  it("signs a null bucket's token for no member, so a claim refuses it", async () => {
    const { app, media } = await compile();
    const foreign = await fakeUpload(app, null, { mediaType: MediaType.Png });
    await expect(media.claim(foreign, ProductImagesBucket)).rejects.toBeInstanceOf(
      UploadBucketMismatchError,
    );
  });

  it("still applies the bucket's rules", async () => {
    const { app } = await compile();
    await expect(
      fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Pdf }),
    ).rejects.toBeInstanceOf(UploadRejectedError);
  });

  it("stores the given bytes", async () => {
    const { app, memory } = await compile();
    const image = await fakeUpload(app, ProductImagesBucket, {
      mediaType: MediaType.Jpeg,
      bytes: new Uint8Array(32),
    });
    expect((await memory.stat(`uploads/${image.id}`))?.size).toBe(32);
  });

  it("refuses an app whose media disk is not the memory disk", async () => {
    const { app } = await compile(Object.create(MediaDisk.prototype) as MediaDisk);
    await expect(
      fakeUpload(app, ProductImagesBucket, { mediaType: MediaType.Png }),
    ).rejects.toThrow(/useDrivers\("memory"\)/);
  });
});
