/**
 * Stackra file contract:
 * Purpose: unit tests of `EncoreBucketFileSystemDriver`: a driver of `FileSystem` that forwards each call to the
 *          `EncoreBucket` port with a normalised key, maps a missing object to `FileNotFoundError` and turns a duration
 *          into Encore's `ttl` seconds.
 * Boundary: test only; an in-memory `EncoreBucket` stands in for the generated Encore driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0124.
 */
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EncoreBucket } from "#contracts/ports/encore-bucket.port";
import { FileSystem } from "#contracts/ports/file-system.port";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { EncoreBucketFileSystemDriver } from "#node/drivers/encore-bucket-file-system.driver";

/** An Encore bucket held in a Map, recording the last signed-URL call. */
class MemoryBucket extends EncoreBucket {
  readonly objects = new Map<string, { data: Uint8Array; contentType?: string }>();

  lastSigned: { name: string; ttl: number } | null = null;

  async upload(name: string, data: Uint8Array, options?: { contentType?: string }): Promise<void> {
    this.objects.set(name, {
      data,
      ...(options?.contentType === undefined ? {} : { contentType: options.contentType }),
    });
  }

  async download(name: string): Promise<Uint8Array> {
    const object = this.objects.get(name);
    if (object === undefined) throw new Error("object not found");
    return object.data;
  }

  async exists(name: string): Promise<boolean> {
    return this.objects.has(name);
  }

  async remove(name: string): Promise<void> {
    this.objects.delete(name);
  }

  async *list(query: { prefix?: string }): AsyncIterable<{ name: string; size: number }> {
    for (const [name, object] of this.objects)
      if (name.startsWith(query.prefix ?? "")) yield { name, size: object.data.byteLength };
  }

  async attrs(name: string): Promise<{ size: number; contentType?: string }> {
    const object = this.objects.get(name);
    if (object === undefined) throw new Error("object not found");
    return {
      size: object.data.byteLength,
      ...(object.contentType === undefined ? {} : { contentType: object.contentType }),
    };
  }

  publicUrl(name: string): string {
    return `https://bucket.encore.test/${name}`;
  }

  async signedUploadUrl(name: string, options: { ttl: number }): Promise<{ url: string }> {
    this.lastSigned = { name, ttl: options.ttl };
    return { url: `https://bucket.encore.test/${name}?upload=1` };
  }

  async signedDownloadUrl(name: string, options: { ttl: number }): Promise<{ url: string }> {
    this.lastSigned = { name, ttl: options.ttl };
    return { url: `https://bucket.encore.test/${name}?signed=1` };
  }
}

describe("EncoreBucketFileSystemDriver", () => {
  it("is a driver of FileSystem", () => {
    expect(new EncoreBucketFileSystemDriver(new MemoryBucket())).toBeInstanceOf(FileSystem);
    expect(kindOf(EncoreBucketFileSystemDriver)).toEqual({
      kind: "driver",
      options: { port: FileSystem },
    });
  });

  it("uploads with a normalised key and its content type, then reads it back", async () => {
    const bucket = new MemoryBucket();
    const files = new EncoreBucketFileSystemDriver(bucket);
    await files.write("/exports//orders.csv", "a,b", { contentType: "text/csv" });
    expect(bucket.objects.get("exports/orders.csv")?.contentType).toBe("text/csv");
    expect(new TextDecoder().decode(await files.read("exports/orders.csv"))).toBe("a,b");
    expect(await files.exists("exports/orders.csv")).toBe(true);
  });

  it("maps a missing object to FileNotFoundError", async () => {
    const files = new EncoreBucketFileSystemDriver(new MemoryBucket());
    await expect(files.read("missing.txt")).rejects.toThrow(FileNotFoundError);
    await expect(files.stat("missing.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("deletes only what exists and says which", async () => {
    const bucket = new MemoryBucket();
    const files = new EncoreBucketFileSystemDriver(bucket);
    await files.write("a.txt", "x");
    expect(await files.delete("a.txt")).toBe(true);
    expect(await files.delete("a.txt")).toBe(false);
    expect(bucket.objects.size).toBe(0);
  });

  it("lists names by prefix, sorted", async () => {
    const files = new EncoreBucketFileSystemDriver(new MemoryBucket());
    for (const key of ["img/b.png", "img/a.png", "doc/c.pdf"]) await files.write(key, "x");
    expect(await files.list()).toEqual(["doc/c.pdf", "img/a.png", "img/b.png"]);
    expect(await files.list("img/")).toEqual(["img/a.png", "img/b.png"]);
  });

  it("stats size and content type, with no modification time", async () => {
    const files = new EncoreBucketFileSystemDriver(new MemoryBucket());
    await files.write("r.pdf", new Uint8Array(3), { contentType: "application/pdf" });
    await files.write("plain.bin", new Uint8Array(1));
    expect(await files.stat("r.pdf")).toEqual({
      path: "r.pdf",
      size: 3,
      lastModified: null,
      contentType: "application/pdf",
    });
    expect((await files.stat("plain.bin")).contentType).toBeNull();
  });

  it("uses the bucket's public and signed URLs, ttl in whole seconds", async () => {
    const bucket = new MemoryBucket();
    const files = new EncoreBucketFileSystemDriver(bucket);
    expect(files.url("/a.png")).toBe("https://bucket.encore.test/a.png");
    expect(await files.temporaryUrl("a.png", Duration.seconds(90.5))).toBe(
      "https://bucket.encore.test/a.png?signed=1",
    );
    expect(bucket.lastSigned).toEqual({ name: "a.png", ttl: 91 });
  });

  it("refuses a key outside the bucket", async () => {
    const files = new EncoreBucketFileSystemDriver(new MemoryBucket());
    await expect(files.write("../x", "y")).rejects.toThrow(RangeError);
    expect(() => files.url("a/../../b")).toThrow(RangeError);
  });

  it("signs an upload through the bucket's signed upload URL, in whole seconds", async () => {
    const bucket = new MemoryBucket();
    const files = new EncoreBucketFileSystemDriver(bucket);
    expect(
      await files.signUpload("uploads/upl_1", {
        contentType: "image/png",
        expiresIn: Duration.seconds(90.5),
      }),
    ).toEqual({
      url: "https://bucket.encore.test/uploads/upl_1?upload=1",
      method: "PUT",
      headers: { "content-type": "image/png" },
    });
    expect(bucket.lastSigned).toEqual({ name: "uploads/upl_1", ttl: 91 });
  });

  it("moves an object by read, write with its content type and remove", async () => {
    const files = new EncoreBucketFileSystemDriver(new MemoryBucket());
    await files.write("uploads/a", "x", { contentType: "image/png" });
    await files.move("uploads/a", "public/a.png");
    expect(await files.exists("uploads/a")).toBe(false);
    expect(await files.stat("public/a.png")).toMatchObject({ size: 1, contentType: "image/png" });
  });
});
