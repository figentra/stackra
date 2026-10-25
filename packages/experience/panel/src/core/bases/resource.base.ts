/**
 * Stackra file contract:
 * Purpose: `Resource<M, R?>({ area, navigation, operations })`, the kind base of one model's admin surface in one area:
 *          `override` members `table`, `views`, `form`, `infolist`, `relations` and `actions` return builders, and the
 *          pages follow from `operations`. `M` is the model; `R` is the list row when it differs from the model.
 * Boundary: called only, with the model as the type argument (gone at runtime: gen reads it); a called form without
 *           it fails with a readable hint (`WithPartner`). A binding, registered as the `resource` kind. The members
 *           are pure: gen runs each once (`describeResource`) and records the tree in the manifest, so a member never
 *           reads anything but its argument. `ResourceBase` is the instance base; the entry exports it as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 to 13); ADR 0164 (as amended); ADR 0305 (rules 5, 43, 44 and 46); ADR 0294
 *                     (decisions 16 and 25).
 */
import { createKind, type WithPartner } from "@stackra/container";
import { ApiArea, Enum } from "@stackra/contracts";

import type { Actions } from "#core/types/actions.type";
import type { Built } from "#core/types/built.type";
import type { Form } from "#core/types/form.type";
import type { FormNode } from "#core/types/form-node.type";
import type { Infolist } from "#core/types/infolist.type";
import type { InfolistNode } from "#core/types/infolist-node.type";
import type { PlacementNode } from "#core/types/placement-node.type";
import type { RelationNode } from "#core/types/relation-node.type";
import type { Relations } from "#core/types/relations.type";
import type { ResourceOptions } from "#core/types/resource-options.type";
import type { Table } from "#core/types/table.type";
import type { TableNode } from "#core/types/table-node.type";
import type { ViewNode } from "#core/types/view-node.type";
import type { Views } from "#core/types/views.type";

/** The operation names a resource may declare. */
const OPERATIONS: ReadonlySet<string> = new Set(["list", "get", "create", "update", "delete"]);

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
   * input), so the base takes any form.
   */
  form(_form: Form<never>): Built<FormNode> | undefined {
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

/** What a called form without its type argument fails with. */
type Hint =
  "Name the model as a type argument: Resource<Order>({ ... }), or Resource<Order, OrderView>({ ... }) when the list row differs";

/** The one called form. */
type ResourceForm = <M extends object = never, R extends object = M>(
  options: WithPartner<M, ResourceOptions, Hint>,
) => abstract new () => ResourceBase<M, R>;

/** Checks the options and records them frozen (an object type, so the kind registry takes it). */
function read(options?: Partial<ResourceOptions>) {
  const area = options?.area;
  if (area === undefined || !Enum.values(ApiArea).includes(area))
    throw new TypeError(`Resource({ area }) is an ApiArea, got ${JSON.stringify(area)}`);
  const operations = options?.operations;
  if (typeof operations !== "object" || operations === null)
    throw new TypeError("Resource({ operations }) lists the resource's operations");
  for (const [name, operation] of Object.entries(operations)) {
    if (!OPERATIONS.has(name))
      throw new TypeError(`Resource({ operations }) has no operation "${name}"`);
    if (operation !== true && typeof operation !== "function")
      throw new TypeError(`Resource({ operations.${name} }) is true or a query or action class`);
  }
  const navigation = options?.navigation;
  if (
    navigation !== undefined &&
    (typeof navigation.group !== "string" || typeof navigation.icon !== "string")
  )
    throw new TypeError("Resource({ navigation }) names a group key and an icon");
  return Object.freeze({
    area,
    operations: Object.freeze({ ...operations }),
    ...(navigation === undefined ? {} : { navigation: Object.freeze({ ...navigation }) }),
    ...(options?.quickCreate === undefined ? {} : { quickCreate: options.quickCreate }),
  });
}

/**
 * The resource kind base.
 *
 * @example
 * export class OrderResource extends Resource<Order, OrderView>({
 *   area: ApiArea.Admin,
 *   operations: { list: ListOrdersQuery, get: GetOrderQuery },
 * }) {
 *   override table(t: Table<OrderView>) {
 *     return t.columns((c) => [c.from("id").copyable(), c.from("status")]);
 *   }
 * }
 */
export const Resource = createKind("resource", ResourceBase, read) as ResourceForm;
