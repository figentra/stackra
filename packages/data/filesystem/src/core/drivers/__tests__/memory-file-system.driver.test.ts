/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFileSystemDriver`: a driver of `FileSystem` that stores copies, lists by prefix,
 *          reports size, time and type, refuses keys outside the disk, builds public and expiring URLs (a reserved
 *          base without `filesystem.url`), moves a file, and signs an upload whose `PUT` it receives or refuses.
 * Boundary: test only; a fixed clock stands in for the system clock, a hand-moved one for upload expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0266.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { MemoryFileSystemDriver } from "#core/drivers/memory-file-system.driver";
import { FileNotFoundError } from "#core/errors/file-not-found.error";

const NOW = new Date("2026-10-24T09:00:00.000Z");

/** Always 2026-10-24T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

/** A memory disk serving from `url`. */
function disk(url: string | null = "https://files.test"): MemoryFileSystemDriver {
  return new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url } }),
    new FixedClock(),
  );
}

describe("MemoryFileSystemDriver", () => {
  it("is a driver of FileSystem", () => {
    expect(disk()).toBeInstanceOf(FileSystem);
    expect(kindOf(MemoryFileSystemDriver)).toEqual({
      kind: "driver",
      options: { port: FileSystem },
    });
  });

  it("writes, reads, checks and deletes a file", async () => {
    const files = disk();
    expect(await files.exists("a/b.txt")).toBe(false);
    await files.write("/a//b.txt", "hello");
    expect(await files.exists("a/b.txt")).toBe(true);
    expect(new TextDecoder().decode(await files.read("a/b.txt"))).toBe("hello");
    expect(await files.delete("a/b.txt")).toBe(true);
    expect(await files.delete("a/b.txt")).toBe(false);
    await expect(files.read("a/b.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("stores and returns copies", async () => {
    const files = disk();
    const bytes = new Uint8Array([1, 2, 3]);
    await files.write("raw.bin", bytes);
    bytes[0] = 9;
    const read = await files.read("raw.bin");
    expect([...read]).toEqual([1, 2, 3]);
    read[1] = 9;
    expect([...(await files.read("raw.bin"))]).toEqual([1, 2, 3]);
  });

  it("lists keys by prefix, sorted", async () => {
    const files = disk();
    for (const key of ["images/b.png", "images/a.png", "images-2026/c.png", "docs/d.pdf"])
      await files.write(key, "x");
    expect(await files.list()).toEqual([
      "docs/d.pdf",
      "images-2026/c.png",
      "images/a.png",
      "images/b.png",
    ]);
    expect(await files.list("images/")).toEqual(["images/a.png", "images/b.png"]);
    expect(await files.list("images")).toEqual([
      "images-2026/c.png",
      "images/a.png",
      "images/b.png",
    ]);
  });

  it("reports size, write time and content type", async () => {
    const files = disk();
    await files.write("report.pdf", new Uint8Array(4), { contentType: "application/pdf" });
    expect(await files.stat("report.pdf")).toEqual({
      path: "report.pdf",
      size: 4,
      lastModified: NOW,
      contentType: "application/pdf",
    });
    await files.write("plain.txt", "é");
    expect(await files.stat("plain.txt")).toMatchObject({ size: 2, contentType: null });
    await expect(files.stat("missing.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("refuses a key outside the disk", async () => {
    const files = disk();
    await expect(files.write("../escape.txt", "x")).rejects.toThrow(RangeError);
    await expect(files.read("a/../../b")).rejects.toThrow(RangeError);
    await expect(files.list("../")).rejects.toThrow(RangeError);
  });

  it("builds public and expiring URLs from filesystem.url", async () => {
    const files = disk();
    expect(files.url("a b.png")).toBe("https://files.test/a%20b.png");
    expect(await files.temporaryUrl("a.png", Duration.minutes(10))).toBe(
      "https://files.test/a.png?expires=2026-10-24T09%3A10%3A00.000Z",
    );
    expect(disk(null).url("a.png")).toBe("https://files.invalid/a.png");
  });

  it("moves a file with its media type and refuses to move nothing", async () => {
    const files = disk();
    await files.write("uploads/a", new Uint8Array([1]), { contentType: "image/png" });
    await files.move("uploads/a", "public/a.png");
    expect(await files.exists("uploads/a")).toBe(false);
    expect(await files.stat("public/a.png")).toMatchObject({ size: 1, contentType: "image/png" });
    await expect(files.move("uploads/a", "public/b.png")).rejects.toThrow(FileNotFoundError);
  });

  it("signs an upload that binds the media type and stores what a client puts", async () => {
    const files = disk();
    const target = await files.signUpload("uploads/upl_1", {
      contentType: "image/png",
      expiresIn: Duration.hours(1),
    });
    expect(target.method).toBe("PUT");
    expect(target.url).toMatch(/^https:\/\/files\.test\/uploads\/upl_1\?signature=/);
    expect(target.headers).toEqual({ "content-type": "image/png" });
    expect(
      await files.receive(target.url, { "Content-Type": "image/png" }, new Uint8Array(3)),
    ).toBe(200);
    expect(await files.stat("uploads/upl_1")).toMatchObject({ size: 3, contentType: "image/png" });
  });

  it("refuses a PUT with a changed header, an unknown signature or after expiry", async () => {
    let now = NOW.getTime();
    const files = new MemoryFileSystemDriver(
      buildConfig(FilesystemConfig),
      new (class extends Clock {
        now(): Date {
          return new Date(now);
        }
      })(),
    );
    const target = await files.signUpload("uploads/upl_1", {
      contentType: "image/png",
      expiresIn: Duration.minutes(1),
    });
    const bytes = new Uint8Array(1);
    expect(await files.receive(target.url, { "content-type": "image/gif" }, bytes)).toBe(403);
    expect(
      await files.receive("https://files.invalid/x?signature=nope", target.headers, bytes),
    ).toBe(403);
    now += 60_001;
    expect(await files.receive(target.url, target.headers, bytes)).toBe(403);
    expect(await files.exists("uploads/upl_1")).toBe(false);
  });

  it("refuses to sign a key outside the disk", async () => {
    await expect(
      disk().signUpload("../x", { contentType: "image/png", expiresIn: Duration.hours(1) }),
    ).rejects.toThrow(RangeError);
  });
});
