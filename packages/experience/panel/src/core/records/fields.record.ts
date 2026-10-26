/**
 * Stackra file contract:
 * Purpose: `FieldsRecord<I>`, what a form's fields callback receives: the runtime side of `FieldFactory<I>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it. A repeater's callback receives a new factory over the item.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 23).
 */
import type { AnyClass } from "@stackra/container";

import { FormField } from "#core/constants/form-field.constant";
import { FormStep } from "#core/constants/form-step.constant";
import { FieldRecord } from "#core/records/field.record";
import type { Built } from "#core/types/built.type";
import type { ElementOf } from "#core/types/element-of.type";
import type { FieldFactory } from "#core/types/field-factory.type";
import type { FieldNode } from "#core/types/field-node.type";
import type { FormStepNode } from "#core/types/form-step-node.type";
import type { Path } from "#core/types/path.type";
import type { PathValue } from "#core/types/path-value.type";

/** The nodes of built steps, read when gen asks. */
const nodesOf = <N>(steps: readonly Built<N>[]): N[] => steps.map((step) => step.toNode());

/** Builds form elements over input type `I`. */
export class FieldsRecord<I> implements FieldFactory<I> {
  /** A field rendered from its type. */
  from(key: Path<I>): FieldRecord {
    return new FieldRecord((flags) => FormField.from(key, flags));
  }

  /**
   * Fields on a grid.
   *
   * @throws RangeError when `columns` is not a whole number from 1 to 12.
   */
  grid(columns: number, fields: readonly Built<FieldNode>[]): Built<FieldNode> {
    if (!Number.isInteger(columns) || columns < 1 || columns > 12)
      throw new RangeError(`grid(columns) is a whole number from 1 to 12, got ${columns}`);
    return { toNode: () => FormField.grid(columns, nodesOf(fields)) };
  }

  /** A wizard on Create, tabs on Edit. */
  steps(name: string, steps: readonly Built<FormStepNode>[]): Built<FieldNode> {
    return { toNode: () => FormField.steps(name, nodesOf(steps)) };
  }

  /** Groups fields into one form step. */
  step(name: string, fields: readonly Built<FieldNode>[]): Built<FormStepNode> {
    return { toNode: () => FormStep.of(name, nodesOf(fields)) };
  }

  /** A file upload attached with `options.action`. */
  upload(key: Path<I>, options: { readonly action: AnyClass }): Built<FieldNode> {
    return { toNode: () => FormField.upload(key, { action: options.action }) };
  }

  /** A list of items built from the item's own paths. */
  repeater<K extends Path<I>>(
    key: K,
    build: (
      field: FieldFactory<ElementOf<NonNullable<PathValue<I, K>>>>,
    ) => readonly Built<FieldNode>[],
  ): Built<FieldNode> {
    const fields = build(new FieldsRecord<ElementOf<NonNullable<PathValue<I, K>>>>());
    return { toNode: () => FormField.repeater(key, nodesOf(fields)) };
  }
}
