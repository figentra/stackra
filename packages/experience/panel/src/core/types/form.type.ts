/**
 * Stackra file contract:
 * Purpose: `Form<I>`, the builder a resource's `form(f)` member receives: the form's elements, every key a path of the
 *          input `I` (the create input, or the create action's input).
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 11).
 */
import type { Built } from "#core/types/built.type";
import type { FieldFactory } from "#core/types/field-factory.type";
import type { FieldNode } from "#core/types/field-node.type";
import type { FormNode } from "#core/types/form-node.type";

/**
 * A resource form over input type `I`.
 *
 * @example
 * override form(f: Form<CreateInput<ProductCollection>>) {
 *   return f.fields((x) => [x.grid(2, [x.from("title").span(2), x.from("slug")])]);
 * }
 */
export interface Form<I> extends Built<FormNode> {
  /** Sets the elements, in order. */
  fields(build: (field: FieldFactory<I>) => readonly Built<FieldNode>[]): this;
}
