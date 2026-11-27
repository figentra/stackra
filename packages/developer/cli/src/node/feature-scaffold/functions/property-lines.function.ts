/**
 * Stackra file contract:
 * Purpose: `propertyLines(fields)`, the class body lines of scaffolded fields: each field's one-line doc, its
 *          decorators and its `name!: Type` (`| null` when nullable), a blank line between fields, decorated fields
 *          first as the member order wants them.
 * Boundary: pure; two-space indentation, as oxfmt writes a class body. The order is otherwise kept.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R4: type-first shapes, decorators refine); ADR 0128 (member order).
 */
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";

/**
 * The property lines of `fields`.
 *
 * @param fields - the fields, in order.
 * @param optional - which fields are written optional (`name?: Type`): none by default.
 * @example
 * propertyLines(parseFields("title:string")).at(-1); // "  title!: string;"
 */
export function propertyLines(
  fields: readonly FeatureField[],
  optional: (field: FeatureField) => boolean = () => false,
): string[] {
  const ordered = [
    ...fields.filter((field) => field.decorators.length > 0),
    ...fields.filter((field) => field.decorators.length === 0),
  ];
  return ordered.flatMap((field, index) => [
    ...(index > 0 ? [""] : []),
    `  /** ${field.doc} */`,
    ...field.decorators.flatMap((decorator) => decorator.split("\n").map((line) => `  ${line}`)),
    `  ${field.name}${optional(field) ? "?" : "!"}: ${field.type}${field.nullable ? " | null" : ""};`,
  ]);
}
