/**
 * Stackra file contract:
 * Purpose: `resolveSchema`, the zod schema of a ref's input or output: the schema itself, or a remote shape class's
 *          static `schema`.
 * Boundary: internal to the ref factories; not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */
import { ZodType } from "zod";

import type { RefSchema } from "#core/types/ref-schema.type";
import type { SchemaOf } from "#core/types/schema-of.type";

/**
 * The zod schema `schema` stands for.
 *
 * @throws TypeError when `schema` is neither a zod schema nor a class with a static zod `schema`.
 */
export function resolveSchema<R extends RefSchema>(schema: R): SchemaOf<R> {
  if (schema instanceof ZodType) return schema as SchemaOf<R>;
  if (schema.schema instanceof ZodType) return schema.schema as SchemaOf<R>;
  throw new TypeError("A ref's input and output must be zod schemas or remoteShape classes");
}
