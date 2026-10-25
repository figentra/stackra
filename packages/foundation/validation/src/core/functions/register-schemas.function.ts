/**
 * Stackra file contract:
 * Purpose: `registerSchemas`, which links shape classes to their generated zod schemas, so `validate(X, raw)`,
 *          `X.create(...)` and `schemaOf(X)` find `X$` (gap G1). Each generated schemas file calls it once with its
 *          `[Class, X$]` pairs; every generated entry loads those files.
 * Boundary: writes the registry only. Registering a class again replaces its schema (a reloaded dev module, a test
 *           that registers its own). Authored code never calls it outside a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); registry v3.1 gap G1.
 */
import type { AnyClass } from "@stackra/container";
import type { ZodType } from "zod";

import { SCHEMA_REGISTRY } from "#core/constants/schema-registry.constant";

/**
 * Records each class's schema.
 *
 * @param pairs - `[Class, X$]` pairs, as a generated schemas file lists them.
 * @example
 * registerSchemas([
 *   [RequestedLine, RequestedLine$],
 *   [CreateOrderInput, CreateOrderInput$],
 * ]);
 */
export function registerSchemas(pairs: readonly (readonly [AnyClass, ZodType])[]): void {
  for (const [type, schema] of pairs) SCHEMA_REGISTRY.set(type, schema);
}
