/**
 * Stackra file contract:
 * Purpose: `encodeQrPng`, a module matrix (a QR code, or the one row of a barcode) as an 8-bit greyscale PNG, each
 *          module a square of pixels, for DOCX (which embeds raster images only).
 * Boundary: internal to this package (`renderDocx`); not exported from the entry. Compression is the platform's
 *           `CompressionStream("deflate")` (zlib), present in Node, browsers and Workers; the CRC is computed here.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import type { QrMatrix } from "#core/types/qr-matrix.type";

/** The eight bytes every PNG starts with. */
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The CRC-32 table of the PNG specification. */
const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xed_b8_83_20 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

/** CRC-32 of `bytes`. */
function crcOf(bytes: Uint8Array): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

/** One PNG chunk: length, type, data, CRC over type and data. */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  // oxlint-disable-next-line unicorn/prefer-code-point -- reads the ASCII PNG chunk type, where code unit and code point agree
  for (let index = 0; index < 4; index += 1) out[4 + index] = type.charCodeAt(index);
  out.set(data, 8);
  view.setUint32(8 + data.length, crcOf(out.subarray(4, 8 + data.length)));
  return out;
}

/**
 * The PNG of `matrix`, `scale` pixels per module; its width is the first row's, so a barcode is one row.
 *
 * @example
 * const png = await encodeQrPng(encodeQr(text, "M"), 8);
 */
export async function encodeQrPng(matrix: QrMatrix, scale: number): Promise<Uint8Array> {
  const width = (matrix[0]?.length ?? 0) * scale;
  const height = matrix.length * scale;
  const raw = new Uint8Array(height * (width + 1));
  for (let y = 0; y < height; y += 1) {
    const row = matrix[Math.floor(y / scale)] ?? [];
    raw[y * (width + 1)] = 0; // filter: none
    for (let x = 0; x < width; x += 1)
      raw[y * (width + 1) + 1 + x] = row[Math.floor(x / scale)] ? 0 : 255;
  }
  const deflated = new Uint8Array(
    await new Response(
      new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 0, 0, 0, 0], 8); // 8-bit greyscale, deflate, adaptive filtering, no interlace
  const parts = [
    new Uint8Array(SIGNATURE),
    chunk("IHDR", header),
    chunk("IDAT", deflated),
    chunk("IEND", new Uint8Array()),
  ];
  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}
