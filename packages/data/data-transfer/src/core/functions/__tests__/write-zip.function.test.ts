/**
 * Stackra file contract:
 * Purpose: unit tests of `writeZip`: deflated and stored entries read back through the central directory with their
 *          names, bytes and CRCs; a failing source fails the archive; more than 65,535 entries write the ZIP64 end
 *          records.
 * Boundary: test only. Reads the archive with a minimal central-directory parser and node:zlib, no zip library.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); APPNOTE.TXT 4.3 and 4.4.
 */
import { crc32, inflateRawSync } from "node:zlib";

import { describe, expect, it } from "@stackra/testing";

import { writeZip } from "#core/functions/write-zip.function";
import type { ZipEntry } from "#core/types/zip-entry.type";

/** The whole archive of `entries`. */
async function zip(entries: Iterable<ZipEntry>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of writeZip(entries, new Date("2026-10-27T10:20:30Z"))) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** The files of `archive`, read through its 32-bit central directory. */
function unzip(archive: Buffer): Map<string, Buffer> {
  const end = archive.length - 22;
  expect(archive.readUInt32LE(end)).toBe(0x06054b50);
  const files = new Map<string, Buffer>();
  let at = archive.readUInt32LE(end + 16);
  for (let index = 0; index < archive.readUInt16LE(end + 10); index += 1) {
    expect(archive.readUInt32LE(at)).toBe(0x02014b50);
    const method = archive.readUInt16LE(at + 10);
    const crc = archive.readUInt32LE(at + 16);
    const size = archive.readUInt32LE(at + 20);
    const nameLength = archive.readUInt16LE(at + 28);
    const local = archive.readUInt32LE(at + 42);
    const name = archive.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    const dataStart =
      local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
    const data = archive.subarray(dataStart, dataStart + size);
    const bytes = method === 8 ? inflateRawSync(data) : Buffer.from(data);
    expect(crc32(bytes)).toBe(crc);
    files.set(name, bytes);
    at += 46 + nameLength + archive.readUInt16LE(at + 30) + archive.readUInt16LE(at + 32);
  }
  return files;
}

async function* lines(count: number): AsyncGenerator<Uint8Array> {
  for (let index = 0; index < count; index += 1)
    yield new TextEncoder().encode(`{"id":${index},"name":"طلب ${index}"}\n`);
}

async function* broken(): AsyncGenerator<Uint8Array> {
  yield new Uint8Array([1]);
  throw new Error("disk gone");
}

describe("writeZip", () => {
  it("writes deflated and stored entries that read back", async () => {
    const manifest = new TextEncoder().encode('{"models":["orders"]}');
    const archive = await zip([
      { name: "manifest.json", bytes: [manifest], method: "store" },
      { name: "models/الطلبات.jsonl", bytes: lines(2000) },
      { name: "empty.txt", bytes: [] },
    ]);
    const files = unzip(archive);
    expect([...files.keys()]).toEqual(["manifest.json", "models/الطلبات.jsonl", "empty.txt"]);
    expect(files.get("manifest.json")).toEqual(Buffer.from(manifest));
    const expected: Uint8Array[] = [];
    for await (const chunk of lines(2000)) expected.push(chunk);
    expect(files.get("models/الطلبات.jsonl")).toEqual(Buffer.concat(expected));
    expect(files.get("empty.txt")).toHaveLength(0);
    expect(archive.length).toBeLessThan(Buffer.concat(expected).length);
  });

  it("marks UTF-8 names and data descriptors", async () => {
    const archive = await zip([{ name: "a.txt", bytes: [new Uint8Array([1, 2, 3])] }]);
    expect(archive.readUInt32LE(0)).toBe(0x04034b50);
    expect(archive.readUInt16LE(6)).toBe(0x0808);
    expect(archive.readUInt16LE(8)).toBe(8);
  });

  it("fails when an entry's source fails", async () => {
    await expect(zip([{ name: "a.txt", bytes: broken() }])).rejects.toThrow("disk gone");
  });

  it("refuses a name past 65,535 bytes", async () => {
    await expect(zip([{ name: "a".repeat(0x10000), bytes: [] }])).rejects.toThrow(RangeError);
  });

  // 65,536 entries take about 9 s on CI, past the default 5 s.
  it("writes the ZIP64 end records past 65,535 entries", { timeout: 30_000 }, async () => {
    const count = 0x10000;
    const archive = await zip(
      Array.from({ length: count }, (_, index) => ({
        name: `${index}`,
        bytes: [],
        method: "store" as const,
      })),
    );
    const end = archive.length - 22;
    expect(archive.readUInt16LE(end + 10)).toBe(0xffff);
    const locator = end - 20;
    expect(archive.readUInt32LE(locator)).toBe(0x07064b50);
    const record = Number(archive.readBigUInt64LE(locator + 8));
    expect(archive.readUInt32LE(record)).toBe(0x06064b50);
    expect(Number(archive.readBigUInt64LE(record + 32))).toBe(count);
    expect(archive.readUInt32LE(Number(archive.readBigUInt64LE(record + 48)))).toBe(0x02014b50);
  });
});
