/**
 * Stackra file contract:
 * Purpose: `ParquetColumnKind`, how `ParquetWriterDriver` stores a column: UTF-8 text, a double, a boolean or a
 *          millisecond UTC timestamp, each optional (null allowed).
 * Boundary: a type only, internal to the Parquet writer; inferred from a column's first non-null cell.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the Parquet writer).
 */

/** A Parquet column's stored kind. */
export type ParquetColumnKind = "utf8" | "double" | "boolean" | "timestamp";
