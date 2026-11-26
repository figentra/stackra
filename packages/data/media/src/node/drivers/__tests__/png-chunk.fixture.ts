/**
 * Stackra file contract:
 * Purpose: `pngChunk()`, one PNG chunk (length, type, data, CRC-32), for writing and rewriting test PNGs.
 * Boundary: test data only; built in memory from the PNG specification (ISO/IEC 15948), no file and no codec.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; COM-73, COM-294; STA-2781.
 */
import { crc32 } from "node:zlib";

/**
 * One PNG chunk: length, type, data, CRC-32 of type and data.
 *
 * @example
 * const end = pngChunk("IEND", Buffer.alloc(0));
 */
export function pngChunk(type: string, data: Buffer): Buffer {
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}
