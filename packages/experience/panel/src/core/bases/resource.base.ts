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

import { ResourceBase } from "#core/bases/resource-base.base";
import type { ResourceOptions } from "#core/types/resource-options.type";

/** The operation names a resource may declare. */
const OPERATIONS: ReadonlySet<string> = new Set(["list", "get", "create", "update", "delete"]);

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
