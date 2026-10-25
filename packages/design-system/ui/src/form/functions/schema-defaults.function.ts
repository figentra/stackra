/**
 * Stackra file contract:
 * Purpose: `schemaDefaults(schema)`, the starting values a schema itself declares: each top-level field whose schema
 *          accepts nothing and answers with a value (a `.default(...)`), so a form opens with them and its fields are
 *          controlled from the first render.
 * Boundary: pure and platform-neutral. A schema that is not an object, and a field with no default, give nothing; the
 *           caller's `defaultValues` are laid over this.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (decision 3: a form builds on its schema); ADR 0165 (decision 2).
 */
import type { ZodType } from "zod";

/**
 * The defaults `schema` declares, by field.
 *
 * @example
 * schemaDefaults(z.object({ quantity: z.number().default(1), sku: z.string() })); // { quantity: 1 }
 */
export function schemaDefaults(schema: ZodType): Record<string, unknown> {
  const shape = (schema as { shape?: Record<string, ZodType> }).shape;
  if (shape === undefined) return {};
  const defaults: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(shape)) {
    const parsed = field.safeParse(undefined);
    if (parsed.success && parsed.data !== undefined) defaults[key] = parsed.data;
  }
  return defaults;
}
