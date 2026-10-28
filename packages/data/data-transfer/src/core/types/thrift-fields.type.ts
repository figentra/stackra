/**
 * Stackra file contract:
 * Purpose: `ThriftFields`, a Thrift struct's fields as `encodeThrift` takes them: `[field id, value]` pairs in
 *          ascending id order.
 * Boundary: a type only, internal to the Parquet writer; an undefined value is a field left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the Parquet writer); Apache Thrift compact
 *                     protocol specification.
 */
import type { ThriftValue } from "#core/types/thrift-value.type";

/** A struct's fields as `[field id, value]` in ascending id order; an undefined value is left out. */
export type ThriftFields = readonly (readonly [number, ThriftValue | undefined])[];
