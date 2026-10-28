/**
 * Stackra file contract:
 * Purpose: `writeZip`, a streaming zip writer: each entry deflated (or stored) as its chunks arrive, a data descriptor
 *          after it, then the central directory, with ZIP64 records once a size, an offset or the entry count passes
 *          the 32-bit fields. It replaces OS data-exchange's store-only, 4 GiB `zipStore` (STA-1260).
 * Boundary: pure apart from the platform `CompressionStream` (`deflate-raw`); holds one central record per entry and
 *           never a whole file. No encryption, no signature (the caller signs the bytes), names written as UTF-8.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2); APPNOTE.TXT 6.3 (4.3 layout, 4.4.4 bit 3, 4.3.14 to 4.3.16 and 4.5.3
 *                     ZIP64).
 */
import { crc32 } from "@stackra/support";

import type { ZipEntry } from "#core/types/zip-entry.type";

/** The largest value a 32-bit field holds; at or past it the field is `0xffffffff` and ZIP64 carries the value. */
const MAX_32 = 0xff_ff_ff_ff;

/** The largest value a 16-bit field holds. */
const MAX_16 = 0xff_ff;

/** General purpose flags: sizes in a data descriptor (bit 3), UTF-8 names (bit 11). */
const FLAGS = 0x08_08;

/** A little-endian record of `size` bytes, filled by `fill`. */
function record(size: number, fill: (view: DataView) => void): Uint8Array {
  const view = new DataView(new ArrayBuffer(size));
  fill(view);
  return new Uint8Array(view.buffer);
}

/** `value` as an unsigned 64-bit little-endian field. */
function set64(view: DataView, offset: number, value: number): void {
  view.setBigUint64(offset, BigInt(value), true);
}

/** `at` as MS-DOS time and date words (UTC). */
function dosTime(at: Date): { time: number; date: number } {
  return {
    time: (at.getUTCHours() << 11) | (at.getUTCMinutes() << 5) | (at.getUTCSeconds() >> 1),
    date:
      ((Math.max(at.getUTCFullYear(), 1980) - 1980) << 9) |
      ((at.getUTCMonth() + 1) << 5) |
      at.getUTCDate(),
  };
}

/**
 * `chunks`, raw-deflated.
 *
 * @yields The compressed chunks.
 */
async function* deflateRaw(chunks: AsyncIterable<Uint8Array>): AsyncGenerator<Uint8Array> {
  const stream = new CompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  const feeding = (async () => {
    // CompressionStream takes ArrayBuffer-backed bytes only, so a chunk over a SharedArrayBuffer is copied first.
    for await (const chunk of chunks)
      await writer.write(
        chunk.buffer instanceof ArrayBuffer
          ? (chunk as Uint8Array<ArrayBuffer>)
          : new Uint8Array(chunk),
      );
    await writer.close();
  })();
  // A failing source errors the readable side, so the read below rejects with the source's error.
  feeding.catch((error: unknown) => writer.abort(error).catch(() => undefined));
  let done = false;
  try {
    for (let read = await reader.read(); !read.done; read = await reader.read()) yield read.value;
    done = true;
  } finally {
    if (!done) await reader.cancel().catch(() => undefined);
  }
  await feeding;
}

/**
 * The archive of `entries`, every file dated `at`.
 *
 * @yields The archive bytes, chunk by chunk.
 * @throws RangeError for an entry name longer than 65,535 bytes.
 * @example
 * const bytes = writeZip([{ name: "manifest.json", bytes: [manifest] }, { name: "orders.jsonl", bytes: orders }], now);
 * await disk.write(path, bytes, { contentType: "application/zip" });
 */
export async function* writeZip(
  entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>,
  at: Date,
): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  const { time, date } = dosTime(at);
  const centrals: Uint8Array[] = [];
  let offset = 0;
  let count = 0;
  for await (const entry of entries) {
    const name = encoder.encode(entry.name);
    if (name.length > MAX_16) throw new RangeError("A zip entry name holds at most 65,535 bytes");
    const method = entry.method === "store" ? 0 : 8;
    const start = offset;
    const local = record(30, (view) => {
      view.setUint32(0, 0x04_03_4b_50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, FLAGS, true);
      view.setUint16(8, method, true);
      view.setUint16(10, time, true);
      view.setUint16(12, date, true);
      view.setUint16(26, name.length, true);
    });
    yield local;
    yield name;
    offset += local.length + name.length;

    const sum = { crc: 0, size: 0 };
    const counted = async function* (): AsyncGenerator<Uint8Array> {
      for await (const chunk of entry.bytes) {
        sum.crc = crc32(chunk, sum.crc);
        sum.size += chunk.length;
        yield chunk;
      }
    };
    let compressed = 0;
    for await (const chunk of method === 8 ? deflateRaw(counted()) : counted()) {
      compressed += chunk.length;
      yield chunk;
    }
    offset += compressed;

    const large = sum.size >= MAX_32 || compressed >= MAX_32;
    const descriptor = record(large ? 24 : 16, (view) => {
      view.setUint32(0, 0x08_07_4b_50, true);
      view.setUint32(4, sum.crc, true);
      if (large) {
        set64(view, 8, compressed);
        set64(view, 16, sum.size);
      } else {
        view.setUint32(8, compressed, true);
        view.setUint32(12, sum.size, true);
      }
    });
    yield descriptor;
    offset += descriptor.length;

    // ZIP64 extra field: only the values whose 32-bit field overflows, in this order (APPNOTE 4.5.3).
    const wide = [sum.size, compressed, start].filter((value) => value >= MAX_32);
    centrals.push(
      record(46 + name.length + (wide.length > 0 ? 4 + wide.length * 8 : 0), (view) => {
        const version = wide.length > 0 ? 45 : 20;
        view.setUint32(0, 0x02_01_4b_50, true);
        view.setUint16(4, 45, true);
        view.setUint16(6, version, true);
        view.setUint16(8, FLAGS, true);
        view.setUint16(10, method, true);
        view.setUint16(12, time, true);
        view.setUint16(14, date, true);
        view.setUint32(16, sum.crc, true);
        view.setUint32(20, Math.min(compressed, MAX_32), true);
        view.setUint32(24, Math.min(sum.size, MAX_32), true);
        view.setUint16(28, name.length, true);
        view.setUint16(30, wide.length > 0 ? 4 + wide.length * 8 : 0, true);
        view.setUint32(42, Math.min(start, MAX_32), true);
        new Uint8Array(view.buffer).set(name, 46);
        if (wide.length === 0) return;
        const extra = 46 + name.length;
        view.setUint16(extra, 0x00_01, true);
        view.setUint16(extra + 2, wide.length * 8, true);
        wide.forEach((value, index) => set64(view, extra + 4 + index * 8, value));
      }),
    );
    count += 1;
  }

  const directoryStart = offset;
  let directorySize = 0;
  for (const central of centrals) {
    directorySize += central.length;
    yield central;
  }
  if (count >= MAX_16 || directoryStart >= MAX_32 || directorySize >= MAX_32) {
    const end64 = directoryStart + directorySize;
    yield record(56, (view) => {
      view.setUint32(0, 0x06_06_4b_50, true);
      set64(view, 4, 44);
      view.setUint16(12, 45, true);
      view.setUint16(14, 45, true);
      set64(view, 24, count);
      set64(view, 32, count);
      set64(view, 40, directorySize);
      set64(view, 48, directoryStart);
    });
    yield record(20, (view) => {
      view.setUint32(0, 0x07_06_4b_50, true);
      set64(view, 8, end64);
      view.setUint32(16, 1, true);
    });
  }
  yield record(22, (view) => {
    view.setUint32(0, 0x06_05_4b_50, true);
    view.setUint16(8, Math.min(count, MAX_16), true);
    view.setUint16(10, Math.min(count, MAX_16), true);
    view.setUint32(12, Math.min(directorySize, MAX_32), true);
    view.setUint32(16, Math.min(directoryStart, MAX_32), true);
  });
}
