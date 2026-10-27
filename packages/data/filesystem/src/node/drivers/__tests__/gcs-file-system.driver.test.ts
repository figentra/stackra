/**
 * Stackra file contract:
 * Purpose: unit tests of `GcsFileSystemDriver`: the bucket and project it builds its client with, the calls it makes
 *          for each method, not-found mapping, streamed downloads, sorted listing and the V4 signed URL request with its seven-day limit.
 * Boundary: test only; `@google-cloud/storage` is replaced by an in-memory stand-in, so no request leaves the process
 *           and no credential is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0354; ADR 0222.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FilesystemConfig } from "#config/filesystem.config";
import { FileSystem } from "#contracts/ports/file-system.port";
import { FileNotFoundError } from "#core/errors/file-not-found.error";
import { GcsFileSystemDriver } from "#node/drivers/gcs-file-system.driver";

/** What the stand-in store holds and records. */
const store = vi.hoisted(() => ({
  objects: new Map<string, { data: Buffer; contentType?: string | undefined }>(),
  options: [] as unknown[],
  buckets: [] as string[],
  signed: [] as unknown[],
}));

vi.mock("@google-cloud/storage", async () => {
  // Imported inside the factory, which vitest hoists above the file's imports.
  const { Readable } = await import("node:stream");
  const notFound = () => Object.assign(new Error("No such object"), { code: 404 });
  class File {
    readonly name: string;

    constructor(name: string) {
      this.name = name;
    }

    async exists() {
      return [store.objects.has(this.name)];
    }

    async download() {
      const object = store.objects.get(this.name);
      if (object === undefined) throw notFound();
      return [object.data];
    }

    createReadStream() {
      const object = store.objects.get(this.name);
      if (object === undefined) throw notFound();
      return Readable.from([object.data]);
    }

    async save(data: string | Buffer, options: { contentType?: string }) {
      store.objects.set(this.name, { data: Buffer.from(data), contentType: options.contentType });
    }

    async delete() {
      if (!store.objects.delete(this.name)) throw notFound();
      return [{}];
    }

    async getMetadata() {
      const object = store.objects.get(this.name);
      if (object === undefined) throw notFound();
      return [
        {
          size: String(object.data.length),
          updated: "2026-10-24T09:00:00.000Z",
          contentType: object.contentType,
        },
      ];
    }

    async getSignedUrl(options: unknown) {
      store.signed.push(options);
      return [`https://storage.googleapis.com/signed/${this.name}`];
    }
  }
  class Storage {
    constructor(options: unknown) {
      store.options.push(options);
    }

    bucket(name: string) {
      store.buckets.push(name);
      return {
        file: (key: string) => new File(key),
        getFiles: async ({ prefix }: { prefix: string }) => [
          [...store.objects.keys()]
            .filter((key) => key.startsWith(prefix))
            .map((key) => new File(key)),
        ],
      };
    }
  }
  return { Storage };
});

/** A gcs disk over `acme-files-sa`. */
function disk(projectId: string | null = null): GcsFileSystemDriver {
  return new GcsFileSystemDriver(
    buildConfig(FilesystemConfig, {
      values: {
        disk: "gcs",
        url: "https://cdn.acme.test",
        gcs: { bucket: "acme-files-sa", projectId },
      },
    }),
  );
}

beforeEach(() => {
  store.objects.clear();
  store.options.length = 0;
  store.buckets.length = 0;
  store.signed.length = 0;
});

describe("GcsFileSystemDriver", () => {
  it("is a driver of FileSystem over the configured bucket and project", () => {
    expect(disk("acme-ksa")).toBeInstanceOf(FileSystem);
    expect(kindOf(GcsFileSystemDriver)).toEqual({ kind: "driver", options: { port: FileSystem } });
    disk();
    expect(store.options).toEqual([{ projectId: "acme-ksa" }, {}]);
    expect(store.buckets).toEqual(["acme-files-sa", "acme-files-sa"]);
  });

  it("refuses a config without a bucket", () => {
    expect(() => new GcsFileSystemDriver(buildConfig(FilesystemConfig))).toThrow(/gcs\.bucket/);
  });

  it("writes, reads, stats and deletes a file", async () => {
    const files = disk();
    await files.write("/exports//orders.csv", "a,b", { contentType: "text/csv" });
    expect(await files.exists("exports/orders.csv")).toBe(true);
    expect(new TextDecoder().decode(await files.read("exports/orders.csv"))).toBe("a,b");
    expect(await files.stat("exports/orders.csv")).toEqual({
      path: "exports/orders.csv",
      size: 3,
      lastModified: new Date("2026-10-24T09:00:00.000Z"),
      contentType: "text/csv",
    });
    expect(await files.delete("exports/orders.csv")).toBe(true);
    expect(await files.delete("exports/orders.csv")).toBe(false);
    expect(await files.exists("exports/orders.csv")).toBe(false);
  });

  it("maps a missing object to FileNotFoundError", async () => {
    const files = disk();
    await expect(files.read("missing.txt")).rejects.toThrow(FileNotFoundError);
    await expect(files.stat("missing.txt")).rejects.toThrow(FileNotFoundError);
  });

  it("lists keys by prefix, sorted", async () => {
    const files = disk();
    await files.write("img/b.png", "b");
    await files.write("img/a.png", "a");
    await files.write("doc/c.pdf", "c");
    expect(await files.list("/img/")).toEqual(["img/a.png", "img/b.png"]);
  });

  it("serves public URLs from filesystem.url and signs a V4 read", async () => {
    const files = disk();
    expect(files.url("a b.png")).toBe("https://cdn.acme.test/a%20b.png");
    expect(await files.temporaryUrl("exports/orders.csv", Duration.minutes(10))).toBe(
      "https://storage.googleapis.com/signed/exports/orders.csv",
    );
    expect(store.signed[0]).toMatchObject({ version: "v4", action: "read" });
    await expect(files.temporaryUrl("a.txt", Duration.days(8))).rejects.toThrow(RangeError);
  });

  it("refuses a key outside the bucket", async () => {
    await expect(disk().write("../x", "y")).rejects.toThrow(RangeError);
  });

  it("streams a download and rejects a missing object before the stream", async () => {
    const files = disk();
    await files.write("imports/orders.csv", "a,b");
    expect(await new Response(await files.readStream("imports/orders.csv")).text()).toBe("a,b");
    await expect(files.readStream("missing.csv")).rejects.toThrow(FileNotFoundError);
  });
});
