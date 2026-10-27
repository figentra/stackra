/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `FileSystem` port: a `Port` whose drivers are its instances, keyed
 *          `filesystem.FileSystem`, with the method shapes every disk implements; the default `writeStream` buffers the
 *          stream into one `write`, a failing stream writes nothing, the default `readStream` serves `read` as one
 *          chunk, the default `move` reads, writes with the media type and deletes, and the default `signUpload`
 *          refuses.
 * Boundary: test only; a minimal subclass stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { Duration, Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";

/** The smallest class that implements every member. */
class StubFileSystem extends FileSystem {
  /** What each `write` stored, in call order. */
  readonly written: [string, Uint8Array | string, unknown][] = [];

  /** What each `delete` removed, in call order. */
  readonly deleted: string[] = [];

  /** What `read` answers. */
  stored = new Uint8Array();

  async exists(): Promise<boolean> {
    return false;
  }

  async read(): Promise<Uint8Array> {
    return this.stored;
  }

  async write(path: string, contents: Uint8Array | string, options?: unknown): Promise<void> {
    this.written.push([path, contents, options]);
  }

  async delete(path: string): Promise<boolean> {
    this.deleted.push(path);
    return false;
  }

  async list(): Promise<string[]> {
    return [];
  }

  async stat(path: string): Promise<FileStat> {
    return { path, size: 0, lastModified: null, contentType: null };
  }

  url(path: string): string {
    return `https://files.test/${path}`;
  }

  async temporaryUrl(path: string): Promise<string> {
    return this.url(path);
  }
}

describe("FileSystem", () => {
  it("is a port its drivers are instances of", () => {
    const disk = new StubFileSystem();
    expect(disk).toBeInstanceOf(FileSystem);
    expect(disk).toBeInstanceOf(Port);
  });

  it("carries its port key as a type-only brand", () => {
    expectTypeOf<FileSystem["~key"]>().toEqualTypeOf<"filesystem.FileSystem">();
    expect("~key" in new StubFileSystem()).toBe(false);
  });

  it("types its members", () => {
    expectTypeOf<FileSystem["read"]>().returns.toEqualTypeOf<Promise<Uint8Array>>();
    expectTypeOf<FileSystem["write"]>().parameter(1).toEqualTypeOf<Uint8Array | string>();
    expectTypeOf<FileSystem["temporaryUrl"]>().parameter(1).toEqualTypeOf<Duration>();
    expectTypeOf<FileSystem["stat"]>().returns.toEqualTypeOf<Promise<FileStat>>();
    expectTypeOf<FileSystem["url"]>().returns.toEqualTypeOf<string>();
    expectTypeOf<FileSystem["readStream"]>().returns.toEqualTypeOf<
      Promise<ReadableStream<Uint8Array>>
    >();
  });

  it("buffers a stream into one write by default", async () => {
    const disk = new StubFileSystem();
    async function* rows() {
      yield "a,";
      yield new Uint8Array([0x62]);
    }
    await disk.writeStream("exports/x.csv", rows(), { contentType: "text/csv" });
    expect(disk.written).toEqual([
      ["exports/x.csv", new TextEncoder().encode("a,b"), { contentType: "text/csv" }],
    ]);
  });

  it("writes nothing when the stream fails", async () => {
    const disk = new StubFileSystem();
    async function* broken(): AsyncGenerator<string> {
      yield "a";
      throw new Error("source failed");
    }
    await expect(disk.writeStream("exports/x.csv", broken())).rejects.toThrow("source failed");
    expect(disk.written).toEqual([]);
  });

  it("serves read as one chunk by default", async () => {
    const disk = new StubFileSystem();
    disk.stored = new TextEncoder().encode("a,b");
    expect(await new Response(await disk.readStream("x.csv")).text()).toBe("a,b");
    disk.stored = new Uint8Array();
    expect(await new Response(await disk.readStream("empty.csv")).text()).toBe("");
  });

  it("rejects readStream when read rejects", async () => {
    const disk = new StubFileSystem();
    disk.read = async () => {
      throw new Error("not there");
    };
    await expect(disk.readStream("x.csv")).rejects.toThrow("not there");
  });

  it("moves by read, write with the media type, and delete by default", async () => {
    const disk = new StubFileSystem();
    disk.stored = new Uint8Array([1, 2]);
    disk.stat = async (path) => ({ path, size: 2, lastModified: null, contentType: "image/png" });
    await disk.move("uploads/a", "public/a.png");
    expect(disk.written).toEqual([
      ["public/a.png", new Uint8Array([1, 2]), { contentType: "image/png" }],
    ]);
    expect(disk.deleted).toEqual(["uploads/a"]);
  });

  it("moves without a media type when the disk keeps none", async () => {
    const disk = new StubFileSystem();
    await disk.move("a", "b");
    expect(disk.written).toEqual([["b", new Uint8Array(), {}]]);
  });

  it("refuses to sign an upload by default", async () => {
    const disk = new StubFileSystem();
    await expect(
      disk.signUpload("uploads/a", { contentType: "image/png", expiresIn: Duration.hours(1) }),
    ).rejects.toThrow(TypeError);
    expect(disk.written).toEqual([]);
  });
});
