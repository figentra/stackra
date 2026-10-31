/**
 * Stackra file contract:
 * Purpose: `readZip`, the files of a zip archive held in memory, read through its central directory (ZIP64 records
 *          included) and inflated one at a time with `node:zlib` (STA-1736, in place of exceljs's unzipper).
 * Boundary: node only; internal to the XLSX reader. Stored and deflated entries only; an encrypted entry, another
 *           method or a malformed archive is refused as `TypeError`. The CRC is not checked: XML parsing fails on
 *           corrupt bytes anyway.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); APPNOTE.TXT 6.3 (4.3.12, 4.3.14 to 4.3.16, 4.5.3).
 */
import { inflateRawSync } from "node:zlib";

/** The end of central directory record cannot start further back than its fixed part plus a 64 KiB comment. */
const EOCD_REACH = 22 + 0xff_ff;
const MAX_32 = 0xff_ff_ff_ff;

/** Refuses the archive, saying `why`. */
function refuse(why: string): never {
  throw new TypeError(`The file is not a readable zip archive: ${why}`);
}

/** Where one entry lives in the archive. */
interface Located {
  readonly method: number;
  readonly flags: number;
  readonly compressedSize: number;
  readonly localOffset: number;
}

/**
 * The file reader of the zip `bytes`.
 *
 * @returns a function from an entry name to its bytes, or `undefined` when the archive has no such entry.
 * @throws TypeError when `bytes` is not a zip archive this reader can open.
 * @example
 * const file = readZip(bytes);
 * const xml = file("xl/workbook.xml");
 */
export function readZip(bytes: Uint8Array): (name: string) => Uint8Array | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (at: number) => view.getUint16(at, true);
  const u32 = (at: number) => view.getUint32(at, true);
  const u64 = (at: number) => Number(view.getBigUint64(at, true));

  let eocd = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - EOCD_REACH); at--)
    if (u32(at) === 0x06_05_4b_50) {
      eocd = at;
      break;
    }
  if (eocd < 0) refuse("no end of central directory");
  let count = u16(eocd + 10);
  let offset = u32(eocd + 16);
  if ((offset === MAX_32 || count === 0xff_ff) && eocd >= 20 && u32(eocd - 20) === 0x07_06_4b_50) {
    const zip64 = u64(eocd - 20 + 8);
    if (u32(zip64) !== 0x06_06_4b_50) refuse("a broken ZIP64 record");
    count = u64(zip64 + 32);
    offset = u64(zip64 + 48);
  }

  const entries = new Map<string, Located>();
  const decoder = new TextDecoder();
  for (let index = 0, at = offset; index < count; index++) {
    if (at + 46 > bytes.length || u32(at) !== 0x02_01_4b_50) refuse("a broken central directory");
    const nameLength = u16(at + 28);
    const extraLength = u16(at + 30);
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
    entries.set(decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength)), {
      method: u16(at + 10),
      flags: u16(at + 8),
      compressedSize,
      localOffset,
    });
    at += 46 + nameLength + extraLength + u16(at + 32);
  }

  return (name) => {
    const entry = entries.get(name);
    if (entry === undefined) return undefined;
    if ((entry.flags & 0x01) !== 0) refuse(`${name} is encrypted`);
    const local = entry.localOffset;
    if (u32(local) !== 0x04_03_4b_50) refuse(`${name} has no local header`);
    const start = local + 30 + u16(local + 26) + u16(local + 28);
    const data = bytes.subarray(start, start + entry.compressedSize);
    if (entry.method === 0) return data;
    if (entry.method === 8) return new Uint8Array(inflateRawSync(data));
    return refuse(`${name} uses compression method ${entry.method}`);
  };
}
