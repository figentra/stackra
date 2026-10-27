/**
 * Stackra file contract:
 * Purpose: `ResourceBase`, the instance side of a resource: the class `Resource<M, R?>({ area, ... })` in `resource.base.ts` hands to `createKind`, so every
 *          `Resource(...)` class extends it.
 * Boundary: the instance base only; the kind brand is type-only. The called form, its option checks and its key live in
 *           `resource.base.ts`; the entry exports this class as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 to 13); ADR 0294 (decisions 16 and 25); ADR 0305 (rules 10 to 13, 43 and 46).
 */
import type { Actions } from "#core/types/actions.type";
import type { Built } from "#core/types/built.type";
import type { FormNode } from "#core/types/form-node.type";
import type { Infolist } from "#core/types/infolist.type";
import type { InfolistNode } from "#core/types/infolist-node.type";
import type { PlacementNode } from "#core/types/placement-node.type";
import type { RelationNode } from "#core/types/relation-node.type";
import type { Relations } from "#core/types/relations.type";
import type { Table } from "#core/types/table.type";
import type { TableNode } from "#core/types/table-node.type";
import type { ViewNode } from "#core/types/view-node.type";
import type { Views } from "#core/types/views.type";

/**
 * The instance side every resource shares: one optional member per builder. A member the class does not override
 * records nothing.
 */
export abstract class ResourceBase<M extends object, R extends object = M> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a resource. */
  declare protected readonly "~kind": "resource";

  /** Type-only: the model the resource is the surface of. */
  declare protected readonly "~subject"?: M;

  /** The list table; keys are paths of the row `R`. */
  table(_table: Table<R>): Built<TableNode> | undefined {
    return undefined;
  }

  /** The preset views beside the Default view. */
  views(_views: Views<R>): readonly Built<ViewNode>[] | undefined {
    return undefined;
  }

  /**
   * The Create (and Edit) form. Its parameter is typed by the override (`Form<CreateInput<M>>`, or the create action's
   * input), so the base's is `never`: a `Form<I>` is invariant in `I` (its repeater's paths), so no form type is
   * below every other one, and a method override's parameter only has to accept the base's.
   */
  form(_form: never): Built<FormNode> | undefined {
    return undefined;
  }

  /** The View page's infolist. */
  infolist(_infolist: Infolist<R>): Built<InfolistNode> | undefined {
    return undefined;
  }

  /** The View page's relation managers. */
  relations(_relations: Relations<R>): readonly Built<RelationNode>[] | undefined {
    return undefined;
  }

  /** The buttons: action runs, export, import and create. */
  actions(_actions: Actions<R, R>): readonly Built<PlacementNode>[] | undefined {
    return undefined;
  }
}
