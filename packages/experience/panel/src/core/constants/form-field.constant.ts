/**
 * Stackra file contract:
 * Purpose: `FormField`, the data constructors of a resource form's elements, as a generated form writes them
 *          (`FormField.repeater("variants", [FormField.from("sku")])`).
 * Boundary: pure: each returns a frozen `FieldNode`; the form builder records through them. Named for its kind: a bare
 *           `Field` is `@stackra/validation`'s field decorator (ADR 0294 decision 23, one meaning per word).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 23).
 */
import type { AnyClass } from "@stackra/container";
import type { Enum } from "@stackra/contracts";

import type { FieldNode } from "#core/types/field-node.type";
import type { FormStepNode } from "#core/types/form-step-node.type";

/**
 * Form element nodes.
 *
 * @example
 * FormField.grid(2, [FormField.from("title", { span: 2 }), FormField.from("slug")]);
 * FormField.upload("images", { action: AttachProductImageAction, accept: ["image/png"] });
 */
export const FormField = Object.freeze({
  /** A field rendered from its type. */
  from: (
    key: string,
    options: {
      readonly span?: number;
      readonly enum?: Enum.Any;
      readonly options?: AnyClass;
      readonly optionLabel?: string;
      readonly essential?: boolean;
    } = {},
  ): FieldNode => Object.freeze({ kind: "value", key, ...options }),

  /** A file upload attached with `options.action`. */
  upload: (
    key: string,
    options: {
      readonly action: AnyClass;
      readonly accept?: readonly string[];
      readonly maxBytes?: number;
      readonly essential?: boolean;
    },
  ): FieldNode => Object.freeze({ kind: "upload", key, ...options }),

  /** A list of items, each the group `fields`. */
  repeater: (key: string, fields: readonly FieldNode[]): FieldNode =>
    Object.freeze({ kind: "repeater", key, fields: Object.freeze([...fields]) }),

  /** `fields` on a grid of `columns` columns. */
  grid: (columns: number, fields: readonly FieldNode[]): FieldNode =>
    Object.freeze({ kind: "grid", columns, fields: Object.freeze([...fields]) }),

  /** A wizard on Create, the same steps as tabs on Edit. */
  steps: (name: string, steps: readonly FormStepNode[]): FieldNode =>
    Object.freeze({ kind: "steps", name, steps: Object.freeze([...steps]) }),
});
