/**
 * Stackra file contract:
 * Purpose: `SCHEMA_REGISTRY`, the link from a shape class to its generated zod schema (`X$`): what `validate`,
 *          `X.create` and `schemaOf` read, and what every generated schemas file fills (gap G1).
 * Boundary: module state written only by `registerSchemas` and read only by `schemaOf`; a WeakMap keyed by the class
 *           itself, so a class that is no longer referenced is not kept alive. Not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler emits one `X$` per shape); registry v3.1 gap G1.
 */
import type { ZodType } from "zod";

/** Class to its generated schema; matched exactly, never through a parent class. */
export const SCHEMA_REGISTRY = new WeakMap<object, ZodType>();
