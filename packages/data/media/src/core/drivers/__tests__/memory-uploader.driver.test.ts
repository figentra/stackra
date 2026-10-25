/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryUploaderDriver`: every upload gets a fresh, well-formed token and is recorded with its
 *          file and bucket, in order.
 * Boundary: test only; no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (memory drivers first).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { MemoryUploaderDriver } from "#core/drivers/memory-uploader.driver";
import { Uploader } from "#core/ports/uploader.port";
import { Upload } from "#core/values/upload.value";

describe("MemoryUploaderDriver", () => {
  it("is a driver of Uploader", () => {
    expect(new MemoryUploaderDriver()).toBeInstanceOf(Uploader);
    expect(kindOf(MemoryUploaderDriver)).toEqual({ kind: "driver", options: { port: Uploader } });
  });

  it("returns a fresh token per upload and records each one", async () => {
    const uploader = new MemoryUploaderDriver();
    const front = new Blob(["front"], { type: "image/jpeg" });
    const back = new Blob(["back"], { type: "image/png" });

    const first = await uploader.upload(front, null);
    const second = await uploader.upload(back, "catalogue.product_images");

    expect(Upload.schema.safeParse(first).success).toBe(true);
    expect(second.id).not.toBe(first.id);
    expect(uploader.uploads).toEqual([
      { file: front, bucket: null, upload: first },
      { file: back, bucket: "catalogue.product_images", upload: second },
    ]);
  });
});
