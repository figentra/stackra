/**
 * Stackra file contract:
 * Purpose: `encodeParquetColumn`, which writes one column chunk of a row group as a single uncompressed version 1 data
 *          page: its page header, the definition levels (run-length encoded, bit width 1) and the non-null values in
 *          the plain encoding of the column's kind.
 * Boundary: a pure function, internal to the Parquet writer. Every column is optional and flat (no repetition levels).
 *           A cell that does not fit the kind is refused, except that a `utf8` column writes any cell as text.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the Parquet writer); Apache Parquet format
 *                     (data pages, the RLE/bit-packing hybrid, plain encoding).
 */
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import { PARQUET_CODES } from "#core/constants/parquet-codes.constant";
import { encodeThrift } from "#core/functions/encode-thrift.function";
import type { ParquetColumnKind } from "#core/types/parquet-column-kind.type";

/** Appends `n` as an unsigned LEB128 varint. */
function varint(out: number[], n: number): void {
  let rest = n;
  while (rest >= 0x80) {
    out.push((rest % 0x80) | 0x80);
    rest = Math.floor(rest / 0x80);
  }
  out.push(rest);
}

/** Appends `n` as four little-endian bytes. */
function uint32(out: number[], n: number): void {
  out.push(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff);
}

/** Appends eight little-endian bytes written by `set`. */
function eight(out: number[], set: (view: DataView) => void): void {
  const view = new DataView(new ArrayBuffer(8));
  set(view);
  for (let index = 0; index < 8; index += 1) out.push(view.getUint8(index));
}

/** Refuses a cell that a column of `kind` cannot hold. */
function refuse(kind: ParquetColumnKind, cell: TabularCell): never {
  throw new TypeError(`A ${kind} Parquet column cannot hold ${JSON.stringify(cell)}`);
}

/** Appends the plain encoding of the non-null `cells` of a column of `kind`. */
function plain(out: number[], kind: ParquetColumnKind, cells: readonly TabularCell[]): void {
  if (kind === "boolean") {
    let byte = 0;
    cells.forEach((cell, index) => {
      if (typeof cell !== "boolean") refuse(kind, cell);
      if (cell) byte |= 1 << (index % 8);
      if (index % 8 === 7) {
        out.push(byte);
        byte = 0;
      }
    });
    if (cells.length % 8 !== 0) out.push(byte);
    return;
  }
  const encoder = new TextEncoder();
  for (const cell of cells) {
    if (kind === "double") {
      if (typeof cell !== "number") refuse(kind, cell);
      eight(out, (view) => view.setFloat64(0, cell, true));
    } else if (kind === "timestamp") {
      if (!(cell instanceof Date)) refuse(kind, cell);
      eight(out, (view) => view.setBigInt64(0, BigInt(cell.getTime()), true));
    } else {
      const bytes = encoder.encode(cell instanceof Date ? cell.toISOString() : String(cell));
      uint32(out, bytes.length);
      for (const byte of bytes) out.push(byte);
    }
  }
}

/**
 * The bytes of one column chunk: the page header followed by the page.
 *
 * @throws TypeError when a non-null cell does not fit `kind`.
 * @example
 * encodeParquetColumn("utf8", ["a", null]); // header, then 04000000 02 01 02 00 01000000 61
 */
export function encodeParquetColumn(
  kind: ParquetColumnKind,
  cells: readonly TabularCell[],
): Uint8Array {
  const levels: number[] = [];
  let index = 0;
  while (index < cells.length) {
    const defined = cells[index] !== null;
    let end = index;
    while (end < cells.length && (cells[end] !== null) === defined) end += 1;
    varint(levels, (end - index) * 2);
    levels.push(defined ? 1 : 0);
    index = end;
  }
  const page: number[] = [];
  uint32(page, levels.length);
  for (const byte of levels) page.push(byte);
  plain(
    page,
    kind,
    cells.filter((cell) => cell !== null),
  );
  const header = encodeThrift([
    [1, { type: "i32", value: PARQUET_CODES.dataPage }],
    [2, { type: "i32", value: page.length }],
    [3, { type: "i32", value: page.length }],
    [
      5,
      {
        type: "struct",
        fields: [
          [1, { type: "i32", value: cells.length }],
          [2, { type: "i32", value: PARQUET_CODES.encoding.plain }],
          [3, { type: "i32", value: PARQUET_CODES.encoding.rle }],
          [4, { type: "i32", value: PARQUET_CODES.encoding.rle }],
        ],
      },
    ],
  ]);
  const bytes = new Uint8Array(header.length + page.length);
  bytes.set(header);
  bytes.set(page, header.length);
  return bytes;
}
