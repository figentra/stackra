/**
 * Stackra file contract:
 * Purpose: `FieldFactory<I>`, what the fields callback receives: a field, a grid, steps, an upload and a repeater.
 * Boundary: a type only; every key is a path of the input `I`, and a repeater's fields are paths of its item.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 23: the form's steps are not workflow steps).
 */
import type { AnyClass } from "@stackra/container";

import type { Built } from "#core/types/built.type";
import type { ElementOf } from "#core/types/element-of.type";
import type { FieldBuilder } from "#core/types/field-builder.type";
import type { FieldNode } from "#core/types/field-node.type";
import type { FormStepNode } from "#core/types/form-step-node.type";
import type { Path } from "#core/types/path.type";
import type { PathValue } from "#core/types/path-value.type";

/** Builds the elements of a form over input type `I`. */
export interface FieldFactory<I> {
  /** A field rendered from its type; a `T | null` object renders as a switch that reveals its fields. */
  from: (key: Path<I>) => FieldBuilder;

  /** Fields on a grid of `columns` columns. */
  grid: (columns: number, fields: readonly Built<FieldNode>[]) => Built<FieldNode>;

  /** A wizard on Create, the same steps as tabs on Edit. */
  steps: (name: string, steps: readonly Built<FormStepNode>[]) => Built<FieldNode>;

  /** One step of `steps`. */
  step: (name: string, fields: readonly Built<FieldNode>[]) => Built<FormStepNode>;

  /** A file upload through the bucket's signed URL, attached with `action`. */
  upload: (key: Path<I>, options: { readonly action: AnyClass }) => Built<FieldNode>;

  /** A list of items, each built from the item's own paths. */
  repeater: <K extends Path<I>>(
    key: K,
    build: (
      field: FieldFactory<ElementOf<NonNullable<PathValue<I, K>>>>,
    ) => readonly Built<FieldNode>[],
  ) => Built<FieldNode>;
}
