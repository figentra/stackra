/**
 * Stackra file contract:
 * Purpose: `ThriftValue`, the declarative shape `encodeThrift` writes in the Thrift compact protocol:
 *          the few value types a Parquet footer and page header use.
 * Boundary: a type only, internal to the Parquet writer; i64 values are numbers, so they stay below 2^53.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the Parquet writer); Apache Thrift compact
 *                     protocol specification.
 */
import type { ThriftFields } from "#core/types/thrift-fields.type";

/** One Thrift value. */
export type ThriftValue =
  | { readonly type: "i32"; readonly value: number }
  | { readonly type: "i64"; readonly value: number }
  | { readonly type: "binary"; readonly value: string | Uint8Array }
  | {
      readonly type: "list";
      readonly element: "i32" | "binary" | "struct";
      readonly items: readonly ThriftValue[];
    }
  | { readonly type: "struct"; readonly fields: ThriftFields };
