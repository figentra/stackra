/**
 * Stackra file contract:
 * Purpose: `testPng()`, a small valid PNG written byte by byte, so the C2PA round trip needs no image codec.
 * Boundary: test data only; built in memory from the PNG specification (ISO/IEC 15948), no file and no codec.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; COM-73, COM-294; STA-2781.
 */
import { deflateSync } from "node:zlib";

import { pngChunk } from "#node/drivers/__tests__/png-chunk.fixture";

/**
 * A valid `size` × `size` RGB PNG with a gradient, so no two images share their pixel bytes by accident.
 *
 * @example
 * const png = testPng(16);
 */
export function testPng(size = 16): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit depth, truecolour, deflate, no filter, no interlace
  const rows: Buffer[] = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 3); // filter byte 0 (none), then RGB
    for (let x = 0; x < size; x += 1)
      row.set([Math.floor((x * 255) / size), Math.floor((y * 255) / size), 128], 1 + x * 3);
    rows.push(row);
  }
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk("IHDR", header),
      pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
      pngChunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
