/**
 * Stackra file contract:
 * Purpose: unit tests of `LocalFileSystemDriver`: a driver of `FileSystem` over a real folder that writes atomically,
 *          lists files only, streams reads from disk, maps missing files to `FileNotFoundError`, keeps every key inside its root and refuses to
 *          sign URLs.
 * Boundary: test only; each test gets a fresh folder under the OS temporary directory, removed afterwards.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0222 (decision 1).
 */
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { LocalFileSystemDriver } from "#node/drivers/local-file-system.driver";

let root = "";

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stackra-filesystem-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** A local disk over this test's folder. */
function disk(url: string | null = "https://files.test"): LocalFileSystemDriver {
  return new LocalFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { disk: "local", root, url } }),
  );
}

describe("LocalFileSystemDriver", () => {
  it("is a driver of FileSystem rooted at the configured folder", () => {
    expect(disk()).toBeInstanceOf(FileSystem);
    expect(kindOf(LocalFileSystemDriver)).toEqual({
      kind: "driver",
      options: { port: FileSystem },
    });
    expect(disk().root).toBe(root);
  });

  it("writes into nested folders, reads, checks and deletes", async () => {
    const files = disk();
    await files.write("a/b/c.txt", "hello");
    expect(await files.exists("a/b/c.txt")).toBe(true);
    expect(new TextDecoder().decode(await files.read("a/b/c.txt"))).toBe("hello");
    expect(await files.delete("a/b/c.txt")).toBe(true);
    expect(await files.delete("a/b/c.txt")).toBe(false);
    expect(await files.exists("a/b/c.txt")).toBe(false);
  });

  it("replaces a file and leaves no temporary file behind", async () => {
    const files = disk();
    await files.write("note.txt", "one");
    await files.write("note.txt", new Uint8Array([116, 119, 111]));
    expect(new TextDecoder().decode(await files.read("note.txt"))).toBe("two");
    expect(await readdir(root)).toEqual(["note.txt"]);
  });

  it("treats a folder as no file", async () => {
    const files = disk();
    await files.write("a/b.txt", "x");
    expect(await files.exists("a")).toBe(false);
    await expect(files.read("a")).rejects.toThrow(FileNotFoundError);
    await expect(files.stat("a")).rejects.toThrow(FileNotFoundError);
    expect(await files.delete("a")).toBe(false);
  });

  it("maps a missing file to FileNotFoundError", async () => {
    const files = disk();
    await expect(files.read("missing.txt")).rejects.toThrow(FileNotFoundError);
    await expect(files.stat("no/such/file.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("lists files by prefix, sorted, with / separators", async () => {
    const files = disk();
    for (const key of ["images/b.png", "images/a.png", "images-2026/c.png", "docs/x/d.pdf"])
      await files.write(key, "x");
    expect(await files.list()).toEqual([
      "docs/x/d.pdf",
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
    expect(await files.list("docs/x/d")).toEqual(["docs/x/d.pdf"]);
    expect(await files.list("nothing/here/")).toEqual([]);
  });

  it("lists nothing when the root does not exist yet", async () => {
    await rm(root, { recursive: true });
    expect(await disk().list()).toEqual([]);
  });

  it("reports size and modification time, no content type", async () => {
    const files = disk();
    await files.write("r.pdf", new Uint8Array(5), { contentType: "application/pdf" });
    const stat = await files.stat("r.pdf");
    expect(stat).toMatchObject({ path: "r.pdf", size: 5, contentType: null });
    expect(stat.lastModified).toBeInstanceOf(Date);
  });

  it("keeps every key inside the root", async () => {
    const files = disk();
    await expect(files.write("../escape.txt", "x")).rejects.toThrow(RangeError);
    await expect(files.read("a/../../etc/passwd")).rejects.toThrow(RangeError);
    await expect(files.exists("..")).rejects.toThrow(RangeError);
  });

  it("serves public URLs and refuses to sign", async () => {
    const files = disk();
    expect(files.url("a/b.png")).toBe("https://files.test/a/b.png");
    await expect(files.temporaryUrl("a/b.png", Duration.minutes(5))).rejects.toThrow(/cannot sign/);
    expect(() => disk(null).url("a.png")).toThrow(/filesystem\.url/);
  });

  it("streams a file and rejects a missing file or a folder before the stream", async () => {
    const files = disk();
    await files.write("big/orders.csv", "x".repeat(200_000));
    expect(await new Response(await files.readStream("big/orders.csv")).text()).toBe(
      "x".repeat(200_000),
    );
    await expect(files.readStream("missing.csv")).rejects.toThrow(FileNotFoundError);
    await expect(files.readStream("big")).rejects.toThrow(FileNotFoundError);
    await expect(files.readStream("../escape.csv")).rejects.toThrow(RangeError);
  });
});
