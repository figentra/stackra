/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `FileSystem` port: a `Port` whose drivers are its instances, keyed
 *          `filesystem.FileSystem`, with the method shapes every disk implements; the default `writeStream` buffers the
 *          stream into one `write`, and a failing stream writes nothing.
 * Boundary: test only; a minimal subclass stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import type { Duration } from "@stackra/contracts";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FileSystem } from "#contracts/ports/file-system.port";
import type { FileStat } from "#contracts/types/file-stat.type";

/** The smallest class that implements every member. */
class StubFileSystem extends FileSystem {
  async exists(): Promise<boolean> {
    return false;
  }
  async read(): Promise<Uint8Array> {
    return new Uint8Array();
  }
  /** What each `write` stored, in call order. */
  readonly written: [string, Uint8Array | string, unknown][] = [];
  async write(path: string, contents: Uint8Array | string, options?: unknown): Promise<void> {
    this.written.push([path, contents, options]);
  }
  async delete(): Promise<boolean> {
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
});
