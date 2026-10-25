/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryMediaDiskDriver`: a signed `PUT` is kept only with a known signature, before expiry
 *          and with every signed header unchanged; stat, move, delete and both URL forms follow the port.
 * Boundary: test only; no network. A hand-moved clock drives expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (memory drivers first); ADR 0222 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { FileNotFoundError, FilesystemConfig } from "@stackra/filesystem";
import { describe, expect, it } from "@stackra/testing";

import { MediaDisk } from "#contracts/ports/media-disk.port";
import { MemoryMediaDiskDriver } from "#core/drivers/memory-media-disk.driver";

/** A clock a test moves by hand. */
class TestClock extends Clock {
  at = new Date("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }
}

/** A memory disk, with `filesystem.url` when `url` is given. */
function setup(url: string | null = "https://cdn.test") {
  const clock = new TestClock();
  const disk = new MemoryMediaDiskDriver(buildConfig(FilesystemConfig, { values: { url } }), clock);
  return { clock, disk };
}

const REQUEST = {
  contentType: "image/png",
  metadata: { bucket: "catalogue.product_images" },
  expiresIn: Duration.minutes(10),
};

describe("MemoryMediaDiskDriver", () => {
  it("is a driver of MediaDisk", () => {
    expect(setup().disk).toBeInstanceOf(MediaDisk);
    expect(kindOf(MemoryMediaDiskDriver)).toEqual({ kind: "driver", options: { port: MediaDisk } });
  });

  it("keeps the bytes of a signed PUT with the signed type and metadata", async () => {
    const { disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    expect(target.method).toBe("PUT");
    expect(target.headers).toEqual({
      "content-type": "image/png",
      "x-meta-bucket": "catalogue.product_images",
    });
    expect(await disk.receive(target.url, target.headers, new Uint8Array([1, 2, 3]))).toBe(200);
    expect(await disk.stat("uploads/upl_1")).toEqual({
      size: 3,
      contentType: "image/png",
      metadata: { bucket: "catalogue.product_images" },
    });
  });

  it("refuses an unknown signature", async () => {
    const { disk } = setup();
    expect(
      await disk.receive("https://cdn.test/uploads/upl_1?signature=forged", {}, new Uint8Array(1)),
    ).toBe(403);
  });

  it("refuses a PUT after the URL expired", async () => {
    const { clock, disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    clock.at = new Date("2026-10-24T09:10:00.001Z");
    expect(await disk.receive(target.url, target.headers, new Uint8Array(1))).toBe(403);
  });

  it("refuses a changed or missing signed header", async () => {
    const { disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    const changed = { ...target.headers, "x-meta-bucket": "billing.invoices" };
    expect(await disk.receive(target.url, changed, new Uint8Array(1))).toBe(403);
    expect(await disk.receive(target.url, { "content-type": "image/png" }, new Uint8Array(1))).toBe(
      403,
    );
    expect(await disk.stat("uploads/upl_1")).toBeNull();
  });

  it("reads header names case-insensitively", async () => {
    const { disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    const sent = { "Content-Type": "image/png", "X-Meta-Bucket": "catalogue.product_images" };
    expect(await disk.receive(target.url, sent, new Uint8Array(1))).toBe(200);
  });

  it("keeps a copy of the bytes", async () => {
    const { disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    const bytes = new Uint8Array([1, 2]);
    await disk.receive(target.url, target.headers, bytes);
    bytes.fill(9);
    await disk.move("uploads/upl_1", "public/a.png");
    expect((await disk.stat("public/a.png"))?.size).toBe(2);
  });

  it("moves an object, and refuses to move nothing", async () => {
    const { disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    await disk.receive(target.url, target.headers, new Uint8Array(1));
    await disk.move("uploads/upl_1", "public/catalogue/product_images/upl_1.png");
    expect(await disk.stat("uploads/upl_1")).toBeNull();
    expect(await disk.stat("public/catalogue/product_images/upl_1.png")).not.toBeNull();
    await expect(disk.move("uploads/upl_1", "public/x.png")).rejects.toBeInstanceOf(
      FileNotFoundError,
    );
  });

  it("deletes an object and says whether there was one", async () => {
    const { disk } = setup();
    const target = await disk.signUpload("uploads/upl_1", REQUEST);
    await disk.receive(target.url, target.headers, new Uint8Array(1));
    expect(await disk.delete("uploads/upl_1")).toBe(true);
    expect(await disk.delete("uploads/upl_1")).toBe(false);
  });

  it("serves URLs from filesystem.url, else from a reserved name", async () => {
    expect(setup().disk.url("public/a b.png")).toBe("https://cdn.test/public/a%20b.png");
    expect(setup(null).disk.url("public/a.png")).toBe("https://media.invalid/public/a.png");
  });

  it("gives a temporary URL with its expiry", async () => {
    expect(await setup().disk.temporaryUrl("private/a.pdf", Duration.minutes(5))).toBe(
      "https://cdn.test/private/a.pdf?expires=2026-10-24T09%3A05%3A00.000Z",
    );
  });
});
