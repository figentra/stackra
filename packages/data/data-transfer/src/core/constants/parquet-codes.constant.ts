/**
 * Stackra file contract:
 * Purpose: `PARQUET_CODES`, the Parquet format numbers `ParquetWriterDriver` writes: the magic, physical and converted
 *          types, the repetition, the encodings, the codec and the page type.
 * Boundary: data only, internal to the Parquet writer; values from the Apache Parquet `parquet.thrift`.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the Parquet writer); Apache Parquet format.
 */

/** The Parquet format numbers the writer uses. */
export const PARQUET_CODES = Object.freeze({
  /** The four bytes a Parquet file starts and ends with. */
  magic: "PAR1",
  /** Physical types. */
  type: Object.freeze({ boolean: 0, int64: 2, double: 5, byteArray: 6 }),
  /** Converted (logical) types. */
  convertedType: Object.freeze({ utf8: 0, timestampMillis: 9 }),
  /** Field repetition: every column is optional. */
  optional: 1,
  /** Encodings: plain values, run-length definition levels. */
  encoding: Object.freeze({ plain: 0, rle: 3 }),
  /** Compression: none. */
  uncompressed: 0,
  /** Page type: a version 1 data page. */
  dataPage: 0,
});
