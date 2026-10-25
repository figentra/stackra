/**
 * Stackra file contract:
 * Purpose: `ActionRegistration`, one row gen hands `registerActions`: an action or query class with the identity gen
 *          derived and locked in the manifest (key, permission, risk) and its input schema class.
 * Boundary: a type only. The module key and the permission are derived from folders and statics, which are gone at
 *           runtime, so this row is how the pipeline knows them. Without a row the pipeline uses the written key, asks
 *           `AccessControl` with no permission name and does not validate the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22: derived identities, the manifest lock); ADR 0095 as amended
 *                     (input schemas).
 */
import type { AnyClass } from "@stackra/container";

import type { Effect } from "#contracts/enums/effect.enum";
import type { ActionBase } from "#core/bases/action.base";
import type { QueryBase } from "#core/bases/query.base";

/** The derived identity of one action or query. */
export interface ActionRegistration {
  /** The action or query class. */
  readonly type: AnyClass<ActionBase | QueryBase>;

  /** The locked key, `<module>.<model>.<verb>@<major>` (`orders.order.create@1`). */
  readonly key: string;

  /** The derived permission, `<module>.<model>.<verb>` (`orders.order.create`). */
  readonly permission?: string;

  /** The permission's risk, `L0` to `L4`. */
  readonly risk?: string;

  /** The permission's effect tags. */
  readonly effects?: readonly Effect[];

  /** The input schema class, whose generated schema the pipeline validates the input with. */
  readonly input?: AnyClass;
}
