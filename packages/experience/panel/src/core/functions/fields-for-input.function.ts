/**
 * Stackra file contract:
 * Purpose: `fieldsForInput(fields, input)`, the recorded form elements one page's action takes: a field whose top-level
 *          key the input lacks is dropped, and a grid or step left empty goes with it. One recorded form so serves
 *          Create and Edit when the create and update inputs differ (an `active` switch only Edit takes).
 * Boundary: internal; pure. Reads the top-level keys of a zod object schema only; a schema without a shape keeps every
 *           field. Web and native forms share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the create or update input).
 */
import type { ZodType } from "zod";

import type { FieldNode } from "#core/types/field-node.type";

/**
 * The elements of `fields` whose keys `input` has.
 *
 * @example
 * fieldsForInput(tree.form.fields, CreateZoneAction.input); // without the `active` switch UpdateZoneAction takes
 */
export function fieldsForInput(
  fields: readonly FieldNode[],
  input: ZodType | undefined,
): FieldNode[] {
  const shape = (input as { readonly shape?: Readonly<Record<string, unknown>> } | undefined)
    ?.shape;
  if (shape === undefined) return [...fields];
  const keep = (nodes: readonly FieldNode[]): FieldNode[] =>
    nodes.flatMap((node): FieldNode[] => {
      if (node.kind === "grid") {
        const kept = keep(node.fields);
        return kept.length === 0 ? [] : [{ ...node, fields: kept }];
      }
      if (node.kind === "steps") {
        const steps = node.steps
          .map((step) => ({ ...step, fields: keep(step.fields) }))
          .filter((step) => step.fields.length > 0);
        return steps.length === 0 ? [] : [{ ...node, steps }];
      }
      return Object.hasOwn(shape, node.key.split(".")[0] ?? "") ? [node] : [];
    });
  return keep(fields);
}
