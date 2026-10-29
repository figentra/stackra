/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoFileSystemDriver`: a driver of `FileSystem` rooted at `<documents>/<root>` that writes
 *          through a cache file, reads, lists, stats and deletes there, refuses keys outside it and answers `file:` URIs.
 * Boundary: test only; expo-file-system does not load in vitest, so `File`, `Directory` and `Paths` are a small
 *           in-memory stand-in keyed by URI.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 4: `vi.mock` from @stackra/testing hoists);
 *                     ADR 0478.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { ExpoFileSystemDriver } from "#native/drivers/expo-file-system.driver";

/** The stand-in's files (URI to bytes and write time), folders (URIs) and URI helpers. */
const disk = vi.hoisted(() => ({
  files: new Map<string, { bytes: Uint8Array; time: number }>(),
  folders: new Set<string>(),
  /** The `file://` URI of the parts joined, with no doubled or trailing slash. */
  join: (...parts: (string | { uri: string })[]): string => {
    const path = parts
      .map((part) => (typeof part === "string" ? part : part.uri).replace(/^file:\/\//, ""))
      .join("/")
      .replaceAll(/\/+/g, "/")
      .replace(/\/$/, "");
    return `file://${path}`;
  },
  /** The URI of the direct child of `parent` that leads to `uri`. */
  childOf: (parent: string, uri: string): string => {
    const slash = uri.indexOf("/", parent.length + 1);
    return slash === -1 ? uri : uri.slice(0, slash);
  },
}));

vi.mock("expo-file-system", () => {
  class Directory {
    readonly uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = disk.join(...parts);
    }

    get name() {
      return this.uri.split("/").pop() ?? "";
    }

    get exists() {
      return disk.folders.has(this.uri);
    }

    create() {
      let at = this.uri;
      while (at !== "file://") {
        disk.folders.add(at);
        at = at.slice(0, at.lastIndexOf("/"));
      }
    }

    list() {
      const children = new Set<string>();
      for (const uri of [...disk.folders, ...disk.files.keys()])
        if (uri.startsWith(`${this.uri}/`)) children.add(disk.childOf(this.uri, uri));
      return [...children].map((uri) =>
        disk.folders.has(uri) ? new Directory(uri) : new File(uri),
      );
    }
  }
  class File {
    uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = disk.join(...parts);
    }

    get name() {
      return this.uri.split("/").pop() ?? "";
    }

    get exists() {
      return disk.files.has(this.uri);
    }

    get parentDirectory() {
      return new Directory(this.uri.slice(0, this.uri.lastIndexOf("/")));
    }

    create() {
      disk.files.set(this.uri, { bytes: new Uint8Array(), time: 1 });
    }

    write(contents: Uint8Array | string) {
      const bytes = typeof contents === "string" ? new TextEncoder().encode(contents) : contents;
      disk.files.set(this.uri, { bytes, time: Date.parse("2026-10-29T09:00:00Z") });
    }

    async bytes() {
      return new Uint8Array(disk.files.get(this.uri)?.bytes ?? []);
    }

    info() {
      const file = disk.files.get(this.uri);
      return {
        exists: file !== undefined,
        size: file?.bytes.byteLength,
        modificationTime: file?.time,
      };
    }

    delete() {
      disk.files.delete(this.uri);
    }

    async move(target: File) {
      const file = disk.files.get(this.uri);
      if (file === undefined || !target.parentDirectory.exists) throw new Error("cannot move");
      disk.files.set(target.uri, file);
      disk.files.delete(this.uri);
      this.uri = target.uri;
    }
  }
  return {
    Directory,
    File,
    Paths: { document: new Directory("file:///documents"), cache: new Directory("file:///cache") },
  };
});

/** A driver over the stand-in, rooted at `storage`. */
const driver = () => new ExpoFileSystemDriver(buildConfig(FilesystemConfig));

beforeEach(() => {
  disk.files.clear();
  disk.folders.clear();
  disk.folders.add("file:///cache").add("file:///documents");
});

describe("ExpoFileSystemDriver", () => {
  it("is a driver of FileSystem", () => {
    expect(kindOf(ExpoFileSystemDriver)).toBe("driver");
    expect(driver()).toBeInstanceOf(FileSystem);
  });

  it("writes through the cache, then reads, stats and lists under <documents>/<root>", async () => {
    const files = driver();
    await files.write("inbox/My Scan.pdf", new Uint8Array([1, 2, 3]));
    await files.write("notes.txt", "hello");

    expect([...disk.files.keys()].some((uri) => uri.includes("/cache/"))).toBe(false);
    expect(await files.read("inbox/My Scan.pdf")).toEqual(new Uint8Array([1, 2, 3]));
    expect(await files.exists("notes.txt")).toBe(true);
    expect(await files.stat("inbox//My Scan.pdf")).toEqual({
      path: "inbox/My Scan.pdf",
      size: 3,
      lastModified: new Date("2026-10-29T09:00:00Z"),
      contentType: null,
    });
    expect(await files.list()).toEqual(["inbox/My Scan.pdf", "notes.txt"]);
    expect(await files.list("inbox/")).toEqual(["inbox/My Scan.pdf"]);
  });

  it("deletes, and reports a missing file", async () => {
    const files = driver();
    await files.write("a.txt", "x");
    expect(await files.delete("a.txt")).toBe(true);
    expect(await files.delete("a.txt")).toBe(false);
    await expect(files.read("a.txt")).rejects.toBeInstanceOf(FileNotFoundError);
    await expect(files.stat("a.txt")).rejects.toBeInstanceOf(FileNotFoundError);
  });

  it("refuses a key outside the root", async () => {
    await expect(driver().write("../escape.txt", "x")).rejects.toBeInstanceOf(RangeError);
  });

  it("lists nothing before the first write", async () => {
    expect(await driver().list()).toEqual([]);
  });

  it("answers the file: URI for both URLs", async () => {
    const files = driver();
    expect(files.url("a/b.txt")).toBe("file:///documents/storage/a/b.txt");
    expect(await files.temporaryUrl("a/b.txt", Duration.minutes(5))).toBe(files.url("a/b.txt"));
  });
});
