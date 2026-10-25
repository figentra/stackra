/**
 * Stackra file contract:
 * Purpose: `FormStepNode`, one recorded step of a form's steps: its name and its fields.
 * Boundary: a type only, read from the steps member of `FieldNode` so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0294 (decision 23).
 */
import type { FieldNode } from "#core/types/field-node.type";

/** One step of a form. */
export type FormStepNode = Extract<FieldNode, { readonly kind: "steps" }>["steps"][number];
