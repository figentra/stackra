/**
 * Stackra file contract:
 * Purpose: `SchemaOf<R>`, the zod schema of a `RefSchema`: the schema itself, or a remote shape class's static `schema`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */
import type { ZodType } from "zod";

import type { RefSchema } from "#core/types/ref-schema.type";

/** The zod schema `R` stands for. */
export type SchemaOf<R extends RefSchema> = R extends ZodType
  ? R
  : R extends { readonly schema: infer S extends ZodType }
    ? S
    : never;
