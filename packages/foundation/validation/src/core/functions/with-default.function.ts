/**
 * Stackra file contract:
 * Purpose: `withDefault(schema)(factory)`, the object or array default generated code writes for a field initializer
 *          (`withDefault(Options$.shape.pool)(() => ({ max: 10, idleTimeout: "PT10S" }))`): zod's `.default(factory)`,
 *          with the factory's literal checked against the field's output, so a code stays its literal type, a record
 *          keeps its value type and a duration may be its ISO 8601 text.
 * Boundary: generated code only; authored code writes an initializer. Curried on purpose: zod's `.default` is
 *           overloaded on a value and a factory, and a generic helper infers the literal before it sees the schema,
 *           so either widens `"page"` to `string` (TS2769); the returned function has one plain signature, which types
 *           the literal by the output it must be. The factory runs on every parse, so two parses never share one object.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler; defaults are constants); STA-1605.
 */
import type { z } from "zod";

import type { DefaultLiteral } from "#core/types/default-literal.type";

/**
 * The default of `schema`, built by a factory of its literal.
 *
 * @param schema - the field's schema, without its default.
 * @returns a function that takes the factory and answers `schema.default(factory)`.
 * @example
 * export const HatchSeoConfig$ = z.object({
 *   og: withDefault(OG$)(() => ({ kinds: ["site", "page"], width: 1200 })),
 * });
 */
export function withDefault<S extends z.ZodType>(
  schema: S,
): (factory: () => DefaultLiteral<z.output<S>>) => z.ZodDefault<S> {
  // reason: a brand is type-only (`DefaultLiteral`), so the literal the factory builds is the output value itself
  return (factory) => schema.default(factory as () => never) as z.ZodDefault<S>;
}
