/**
 * Stackra file contract:
 * Purpose: `FormNode`, a recorded resource form: its elements in order.
 * Boundary: a type only; the Create page renders it, and the Edit page with steps as tabs.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms).
 */
import type { FieldNode } from "#core/types/field-node.type";

/** A resource form. */
export interface FormNode {
  /** The elements in order. */
  readonly fields: readonly FieldNode[];
}
