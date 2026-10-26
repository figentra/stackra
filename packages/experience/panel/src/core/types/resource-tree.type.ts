/**
 * Stackra file contract:
 * Purpose: `ResourceTree`, what `describeResource` records for one resource class: its options and the node each of its
 *          builder methods returned.
 * Boundary: a type only; gen writes it under `ui.resources` in the manifest. A member the class does not override is
 *           absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 7: members are override methods returning builders, recorded once).
 */
import type { FormNode } from "#core/types/form-node.type";
import type { InfolistNode } from "#core/types/infolist-node.type";
import type { PlacementNode } from "#core/types/placement-node.type";
import type { RelationNode } from "#core/types/relation-node.type";
import type { ResourceOptions } from "#core/types/resource-options.type";
import type { TableNode } from "#core/types/table-node.type";
import type { ViewNode } from "#core/types/view-node.type";

/** One resource, recorded. */
export interface ResourceTree {
  /** The options the class declared. */
  readonly options: ResourceOptions;

  /** The table, when `table` is overridden. */
  readonly table?: TableNode;

  /** The preset views. */
  readonly views?: readonly ViewNode[];

  /** The create and edit form. */
  readonly form?: FormNode;

  /** The View page's infolist. */
  readonly infolist?: InfolistNode;

  /** The relation managers. */
  readonly relations?: readonly RelationNode[];

  /** The placed buttons. */
  readonly actions?: readonly PlacementNode[];
}
