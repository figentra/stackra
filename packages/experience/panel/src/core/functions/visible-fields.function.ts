/**
 * Stackra file contract:
 * Purpose: `visibleFields(fields, mode)`, the form elements a display mode shows: every one in developer mode; in
 *          normal mode only the fields marked essential, with a repeater, grid or step kept when a field inside it is.
 * Boundary: pure. A mode is display only: a hidden field keeps its value or default, and nothing here grants or denies
 *           an action; the form still submits what the action's input needs.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 1 and 2).
 */
import type { DisplayMode } from "@stackra/ui/contracts";

import type { FieldNode } from "#core/types/field-node.type";

/** `node` as normal mode shows it, or `undefined` when nothing in it is essential. */
function essentialOf(node: FieldNode): FieldNode | undefined {
  switch (node.kind) {
    case "value":
    case "upload":
      return node.essential === true ? node : undefined;
    case "repeater":
      return node.fields.some((field) => essentialOf(field) !== undefined) ? node : undefined;
    case "grid": {
      const fields = node.fields.flatMap((field) => essentialOf(field) ?? []);
      return fields.length === 0
        ? undefined
        : Object.freeze({ ...node, fields: Object.freeze(fields) });
    }
    case "steps": {
      const steps = node.steps.flatMap((step) => {
        const fields = step.fields.flatMap((field) => essentialOf(field) ?? []);
        return fields.length === 0
          ? []
          : [Object.freeze({ ...step, fields: Object.freeze(fields) })];
      });
      return steps.length === 0
        ? undefined
        : Object.freeze({ ...node, steps: Object.freeze(steps) });
    }
  }
}

/**
 * The elements of `fields` shown in `mode`.
 *
 * @example
 * visibleFields(form.fields, "normal"); // the essential fields only
 */
export function visibleFields(
  fields: readonly FieldNode[],
  mode: DisplayMode,
): readonly FieldNode[] {
  return mode === "developer" ? fields : fields.flatMap((field) => essentialOf(field) ?? []);
}
