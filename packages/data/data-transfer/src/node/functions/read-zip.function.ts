/**
 * Stackra file contract:
 * Purpose: `readZip`, the files of an untrusted zip archive held in memory, read through its central directory (ZIP64
 *          records included) and inflated one at a time with `node:zlib` (STA-1736, in place of exceljs's unzipper).
 * Boundary: node only; internal to the XLSX reader. Refuses, as `UnreadableWorkbookError`: bytes that are not a zip,
 *           an encrypted entry or a method other than store and deflate, an entry name that is absolute or climbs
 *           (`..`, a backslash, a drive letter, NUL), more entries than the ceiling, and an entry that inflates past
 *           its ratio, the part ceiling or the file's total. Inflation stops at the ceiling (`maxOutputLength`), so a
 *           bomb never fills memory. The CRC is not checked: XML parsing fails on corrupt bytes anyway.
 * Runtime: node
 * Governing contract: ADR 0367 (decisions 2 and 4); APPNOTE.TXT 6.3 (4.3.12, 4.3.14 to 4.3.16, 4.5.3).
 */
import { inflateRawSync } from "node:zlib";

import { UnreadableWorkbookError } from "#core/errors/unreadable-workbook.error";
import type { XlsxCeilings } from "#node/types/xlsx-ceilings.type";

/** The end of central directory record cannot start further back than its fixed part plus a 64 KiB comment. */
const EOCD_REACH = 22 + 0xff_ff;
const MAX_32 = 0xff_ff_ff_ff;

/** Below this inflated size the ratio is not checked: a small, repetitive part of a real workbook compresses far. */
const RATIO_GRACE = 1024 * 1024;

/** Refuses the archive for `reason`. */
function refuse(reason: UnreadableWorkbookError["reason"]): never {
  throw UnreadableWorkbookError.create({ reason });
}

/** Whether an entry name could reach outside the archive's own tree if written out. */
const isUnsafeName = (name: string): boolean =>
  name.startsWith("/") ||
  name.includes("\\") ||
  name.includes("\0") ||
  /^[a-z]:/i.test(name) ||
  name.split("/").includes("..");

/** Where one entry lives in the archive. */
interface Located {
  readonly method: number;
  readonly flags: number;
  readonly compressedSize: number;
  readonly localOffset: number;
}

/**
 * The file reader of the zip `bytes`, held to `ceilings`.
 *
 * @returns a function from an entry name to its bytes, or `undefined` when the archive has no such entry.
 * @throws UnreadableWorkbookError when `bytes` is not a zip this reader opens, or breaks a ceiling.
 * @example
 * const file = readZip(bytes, XLSX_CEILINGS);
 * const xml = file("xl/workbook.xml");
 */
export function readZip(
  bytes: Uint8Array,
  ceilings: Pick<XlsxCeilings, "entries" | "ratio" | "partBytes" | "totalBytes">,
): (name: string) => Uint8Array | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const inside = (at: number, size: number) => at >= 0 && at + size <= bytes.length;
  const u16 = (at: number) => (inside(at, 2) ? view.getUint16(at, true) : refuse("not_a_zip"));
  const u32 = (at: number) => (inside(at, 4) ? view.getUint32(at, true) : refuse("not_a_zip"));
  const u64 = (at: number) =>
    inside(at, 8) ? Number(view.getBigUint64(at, true)) : refuse("not_a_zip");

  let eocd = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - EOCD_REACH); at--)
    if (u32(at) === 0x06_05_4b_50) {
      eocd = at;
      break;
    }
  if (eocd < 0) refuse("not_a_zip");
  let count = u16(eocd + 10);
  let offset = u32(eocd + 16);
  if ((offset === MAX_32 || count === 0xff_ff) && eocd >= 20 && u32(eocd - 20) === 0x07_06_4b_50) {
    const zip64 = u64(eocd - 20 + 8);
    if (u32(zip64) !== 0x06_06_4b_50) refuse("not_a_zip");
    count = u64(zip64 + 32);
    offset = u64(zip64 + 48);
  }
  if (count > ceilings.entries) refuse("too_many_entries");

  const entries = new Map<string, Located>();
  const decoder = new TextDecoder();
  for (let index = 0, at = offset; index < count; index++) {
    if (u32(at) !== 0x02_01_4b_50) refuse("not_a_zip");
    const nameLength = u16(at + 28);
    const extraLength = u16(at + 30);
    if (!inside(at + 46, nameLength + extraLength)) refuse("not_a_zip");
    let compressedSize = u32(at + 20);
    let uncompressedSize = u32(at + 24);
    let localOffset = u32(at + 42);
    // A ZIP64 extra field (id 1) carries, in order, each of these three that its 32-bit field could not.
    for (let field = at + 46 + nameLength; field + 4 <= at + 46 + nameLength + extraLength;) {
      const size = u16(field + 2);
      if (u16(field) === 0x00_01) {
        let next = field + 4;
        if (uncompressedSize === MAX_32) [uncompressedSize, next] = [u64(next), next + 8];
        if (compressedSize === MAX_32) [compressedSize, next] = [u64(next), next + 8];
        if (localOffset === MAX_32) localOffset = u64(next);
      }
      field += 4 + size;
    }
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    if (isUnsafeName(name)) refuse("unsafe_entry_name");
    entries.set(name, { method: u16(at + 10), flags: u16(at + 8), compressedSize, localOffset });
    at += 46 + nameLength + extraLength + u16(at + 32);
  }

  let inflated = 0;
  return (name) => {
    const entry = entries.get(name);
    if (entry === undefined) return undefined;
    if ((entry.flags & 0x01) !== 0) refuse("encrypted");
    const local = entry.localOffset;
    if (u32(local) !== 0x04_03_4b_50) refuse("not_a_zip");
    const start = local + 30 + u16(local + 26) + u16(local + 28);
    if (!inside(start, entry.compressedSize)) refuse("not_a_zip");
    const data = bytes.subarray(start, start + entry.compressedSize);
    const room = Math.min(ceilings.partBytes, ceilings.totalBytes - inflated);
    const ratioCap = Math.max(entry.compressedSize * ceilings.ratio, RATIO_GRACE);
    let out: Uint8Array;
    if (entry.method === 0) out = data;
    else if (entry.method === 8) {
      const cap = Math.min(room, ratioCap);
      try {
        out = new Uint8Array(inflateRawSync(data, { maxOutputLength: Math.max(cap, 1) }));
      } catch (error) {
        if ((error as { code?: string }).code === "ERR_BUFFER_TOO_LARGE")
          return refuse(ratioCap < room ? "compression_ratio" : "too_large");
        return refuse("not_a_zip");
      }
    } else return refuse("compression_method");
    if (out.length > room) refuse("too_large");
    inflated += out.length;
    return out;
  };
}
