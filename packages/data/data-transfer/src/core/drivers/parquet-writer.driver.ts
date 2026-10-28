/**
 * Stackra file contract:
 * Purpose: `ParquetWriterDriver`, the `parquet` driver of `TabularWriter`: an Apache Parquet file from one sheet, its
 *          header row naming the columns, for a one-off export to a BI tool and for the warehouse sink's files.
 * Boundary: no dependency. Uncompressed, plain-encoded, flat, every column optional. A column's kind comes from its
 *           first non-null cell in the first row group (text, number as double, boolean, `Date` as a millisecond UTC
 *           timestamp; an all-null column is text) and is kept for the file: a later cell of another kind is refused,
 *           except in a text column, which writes any cell as text. Rows stream in row groups of
 *           `TabularWriteOptions.rowGroupRows` (the whole sheet is one group when absent); the footer follows the last.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 4) and ADR 0190 (decision 3), both amended 2026-10-29 (STA-1430); ADR 0367
 *                     (decision 2); Apache Parquet format.
 */
import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { TabularWriteOptions } from "#contracts/types/tabular-write-options.type";
import { PARQUET_CODES } from "#core/constants/parquet-codes.constant";
import { encodeParquetColumn } from "#core/functions/encode-parquet-column.function";
import { encodeThrift } from "#core/functions/encode-thrift.function";
import type { ParquetColumnKind } from "#core/types/parquet-column-kind.type";
import type { ThriftValue } from "#core/types/thrift-value.type";

/** The physical type and converted type of each kind. */
const KIND_CODES: Readonly<
  Record<ParquetColumnKind, { readonly type: number; readonly converted?: number }>
> = {
  utf8: { type: PARQUET_CODES.type.byteArray, converted: PARQUET_CODES.convertedType.utf8 },
  double: { type: PARQUET_CODES.type.double },
  boolean: { type: PARQUET_CODES.type.boolean },
  timestamp: {
    type: PARQUET_CODES.type.int64,
    converted: PARQUET_CODES.convertedType.timestampMillis,
  },
};

/** The kind of a column whose first non-null cell is `cell`. */
function kindOf(cell: TabularCell | undefined): ParquetColumnKind {
  if (typeof cell === "number") return "double";
  if (typeof cell === "boolean") return "boolean";
  if (cell instanceof Date) return "timestamp";
  return "utf8";
}

/** An i32 Thrift value. */
function i32(value: number): ThriftValue {
  return { type: "i32", value };
}

/** An i64 Thrift value. */
function i64(value: number): ThriftValue {
  return { type: "i64", value };
}

/**
 * Writes Parquet files.
 *
 * @example
 * await files.writeStream("exports/orders.parquet", new ParquetWriterDriver().write([{ name: "Orders", rows }]));
 */
export class ParquetWriterDriver extends Driver(TabularWriter) {
  /** The media type of the written file, `application/vnd.apache.parquet`. */
  readonly mediaType = "application/vnd.apache.parquet";

  /**
   * Implements `TabularWriter.write`, documented there.
   *
   * @yields The magic, then each row group's column chunks, then the footer.
   * @throws TypeError when there is not exactly one sheet, the sheet has no header row or repeats a column name, a data
   *         row is longer than the header, a cell does not fit its column, or `rowGroupRows` is not a whole number of
   *         at least 1.
   */
  async *write(
    sheets: readonly TabularSheet[],
    options: TabularWriteOptions = {},
  ): AsyncGenerator<Uint8Array> {
    const [sheet] = sheets;
    if (sheet === undefined || sheets.length !== 1)
      throw new TypeError(
        `A Parquet file holds one sheet, not ${sheets.length}: write each sheet to its own file`,
      );
    const { rowGroupRows } = options;
    if (rowGroupRows !== undefined && (!Number.isInteger(rowGroupRows) || rowGroupRows < 1))
      throw new TypeError(`rowGroupRows must be a whole number of at least 1, got ${rowGroupRows}`);
    const encoder = new TextEncoder();
    const magic = encoder.encode(PARQUET_CODES.magic);
    yield magic;
    let offset = magic.length;
    let header: string[] | undefined;
    let kinds: ParquetColumnKind[] | undefined;
    let group: (readonly TabularCell[])[] = [];
    let rows = 0;
    const rowGroups: ThriftValue[] = [];

    const flush = (): Uint8Array[] => {
      const names = header ?? [];
      kinds ??= names.map((_, column) =>
        kindOf(group.map((row) => row[column] ?? null).find((cell) => cell !== null)),
      );
      const chunks: Uint8Array[] = [];
      const columns: ThriftValue[] = [];
      let size = 0;
      names.forEach((name, column) => {
        const kind = kinds?.[column] ?? "utf8";
        const chunk = encodeParquetColumn(
          kind,
          group.map((row) => row[column] ?? null),
        );
        columns.push({
          type: "struct",
          fields: [
            [2, i64(offset + size)],
            [
              3,
              {
                type: "struct",
                fields: [
                  [1, i32(KIND_CODES[kind].type)],
                  [
                    2,
                    {
                      type: "list",
                      element: "i32",
                      items: [i32(PARQUET_CODES.encoding.plain), i32(PARQUET_CODES.encoding.rle)],
                    },
                  ],
                  [
                    3,
                    { type: "list", element: "binary", items: [{ type: "binary", value: name }] },
                  ],
                  [4, i32(PARQUET_CODES.uncompressed)],
                  [5, i64(group.length)],
                  [6, i64(chunk.length)],
                  [7, i64(chunk.length)],
                  [9, i64(offset + size)],
                ],
              },
            ],
          ],
        });
        chunks.push(chunk);
        size += chunk.length;
      });
      rowGroups.push({
        type: "struct",
        fields: [
          [1, { type: "list", element: "struct", items: columns }],
          [2, i64(size)],
          [3, i64(group.length)],
        ],
      });
      offset += size;
      rows += group.length;
      group = [];
      return chunks;
    };

    for await (const row of sheet.rows) {
      if (header === undefined) {
        const names = row.map((cell) =>
          cell instanceof Date ? cell.toISOString() : String(cell ?? ""),
        );
        header = names;
        const repeated = names.find((name, column) => names.indexOf(name) !== column);
        if (repeated !== undefined)
          throw new TypeError(`A Parquet file cannot repeat the column name "${repeated}"`);
        continue;
      }
      if (row.length > header.length)
        throw new TypeError(
          `A row has ${row.length} cells but the header names ${header.length} columns`,
        );
      group.push(row);
      if (rowGroupRows !== undefined && group.length >= rowGroupRows) yield* flush();
    }
    if (header === undefined) throw new TypeError("A Parquet file needs a header row");
    if (group.length > 0) yield* flush();
    const names = header;
    const footer = encodeThrift([
      [1, i32(1)],
      [
        2,
        {
          type: "list",
          element: "struct",
          items: [
            {
              type: "struct",
              fields: [
                [4, { type: "binary", value: "schema" }],
                [5, i32(names.length)],
              ],
            },
            ...names.map((name, column): ThriftValue => {
              const codes = KIND_CODES[kinds?.[column] ?? "utf8"];
              return {
                type: "struct",
                fields: [
                  [1, i32(codes.type)],
                  [3, i32(PARQUET_CODES.optional)],
                  [4, { type: "binary", value: name }],
                  [6, codes.converted === undefined ? undefined : i32(codes.converted)],
                ],
              };
            }),
          ],
        },
      ],
      [3, i64(rows)],
      [4, { type: "list", element: "struct", items: rowGroups }],
      [6, { type: "binary", value: "stackra data-transfer" }],
    ]);
    const tail = new Uint8Array(footer.length + 8);
    tail.set(footer);
    new DataView(tail.buffer).setUint32(footer.length, footer.length, true);
    tail.set(magic, footer.length + 4);
    yield tail;
  }
}
