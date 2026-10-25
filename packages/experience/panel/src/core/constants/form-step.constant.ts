/**
 * Stackra file contract:
 * Purpose: `FormStep`, the data constructor of one step of a form's steps (`FormStep.of("basics", [...], { grid: 2 })`).
 * Boundary: pure: returns a frozen `FormStepNode`; a `grid` lays the step's fields on that many columns. Named for its
 *           kind: a bare `Step` is a workflow step (ADR 0294 decision 23, one meaning per word).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 23).
 */
import { FormField } from "#core/constants/form-field.constant";
import type { FieldNode } from "#core/types/field-node.type";
import type { FormStepNode } from "#core/types/form-step-node.type";

/**
 * Form step nodes.
 *
 * @example
 * FormStep.of("basics", [FormField.from("title", { span: 2 }), FormField.from("slug")], { grid: 2 });
 */
export const FormStep = Object.freeze({
  /** The step `name` holding `fields`, on a grid when `options.grid` is given. */
  of: (
    name: string,
    fields: readonly FieldNode[],
    options: { readonly grid?: number } = {},
  ): FormStepNode =>
    Object.freeze({
      name,
      fields: Object.freeze(
        options.grid === undefined ? [...fields] : [FormField.grid(options.grid, fields)],
      ),
    }),
});
