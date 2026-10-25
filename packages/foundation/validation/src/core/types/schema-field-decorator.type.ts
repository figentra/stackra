/**
 * Stackra file contract:
 * Purpose: `SchemaFieldDecorator<Out>`, the type of `@Field(zod)`: a legacy field decorator that type-checks only when
 *          every value the schema outputs fits the field, so `@Field(z.string())` on a number is refused while
 *          `@Field(z.literal(true))` on a `boolean` passes.
 * Boundary: a type only. The check runs the other way from `FieldDecorator<T>`: the schema's output must fit the
 *           field, not the field fit a rule's type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: a `@Field(zod)` whose output type differs from the field is refused);
 *                     ADR 0095 as amended (the escape hatch).
 */

/**
 * A field decorator whose schema outputs `Out`.
 *
 * @example
 * const hatch: SchemaFieldDecorator<string> = Field(z.string().email());
 */
export type SchemaFieldDecorator<Out> = <K extends string, O extends { [P in K]?: unknown }>(
  target: O & ([Out] extends [O[K]] ? unknown : never),
  property: K,
) => void;
