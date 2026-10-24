/**
 * Stackra file contract:
 * Purpose: `@Field(zod)`, the escape hatch: a field whose rule the typed decorators cannot say (an email with its own
 *          message, a union beyond `T | null`, a `catch` fallback) carries the zod schema itself, with a `// reason:`
 *          comment above it.
 * Boundary: made with `createDecorator`, so it records the schema and installs no accessor; gen uses the recorded
 *           expression in place of the field's compiled rule. Typed so the schema's output must fit the field: tsc
 *           refuses `@Field(z.string())` on a number. It may mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 26: the hatch carries a reason); ADR 0095 as amended.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { ZodType, output } from "zod";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { SchemaFieldDecorator } from "#core/types/schema-field-decorator.type";

/** The recording decorator; `Field` gives it its schema. */
const FIELD = createDecorator<ZodType>({
  kind: "field",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Gives a field its rule as a zod schema.
 *
 * @example
 * ```ts
 * // reason: an email format with its own i18n message
 * @Field(z.string().trim().email(I18n.web.contact.errors.email).max(254))
 * email!: string;
 * ```
 */
export function Field<Z extends ZodType>(schema: Z): SchemaFieldDecorator<output<Z>> {
  return FIELD(schema) as unknown as SchemaFieldDecorator<output<Z>>;
}

/** The schema recorded on each field of a class and its ancestors. */
Field.members = FIELD.members;
