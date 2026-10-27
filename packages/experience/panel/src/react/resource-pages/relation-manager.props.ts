/**
 * Stackra file contract:
 * Purpose: `RelationManagerProps`, the props of one relation manager on a View page.
 * Boundary: props only.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164.
 */
import type { RelationNode } from "#core/types/relation-node.type";

/** Props of `RelationManager`. */
export interface RelationManagerProps {
  /** The resource key of the View page it sits on (`orders.order`); its labels come from there. */
  readonly resourceKey: string;

  /** The recorded relation: its list query ref, its columns and its binds. */
  readonly relation: RelationNode;

  /** The record the View page shows; the binds read it (`record.id`). */
  readonly record: object;

  /** How many related rows a page holds; 10 when absent. */
  readonly pageSize?: number;
}
