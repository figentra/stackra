/**
 * Stackra file contract:
 * Purpose: `FormRecord<I>`, the builder a resource's `form(f)` member receives: the runtime side of `Form<I>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11).
 */
import { FieldsRecord } from "#core/records/fields.record";
import type { Built } from "#core/types/built.type";
import type { FieldFactory } from "#core/types/field-factory.type";
import type { FieldNode } from "#core/types/field-node.type";
import type { Form } from "#core/types/form.type";
import type { FormNode } from "#core/types/form-node.type";

/** A resource form over input type `I`. */
export class FormRecord<I> implements Form<I> {
  /** The element steps. */
  private steps: readonly Built<FieldNode>[] = [];

  /** Sets the elements. */
  fields(build: (field: FieldFactory<I>) => readonly Built<FieldNode>[]): this {
    this.steps = build(new FieldsRecord<I>());
    return this;
  }

  /** The recorded form. */
  toNode(): FormNode {
    return Object.freeze({ fields: Object.freeze(this.steps.map((step) => step.toNode())) });
  }
}
