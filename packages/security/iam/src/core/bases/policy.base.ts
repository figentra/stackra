/**
 * Stackra file contract:
 * Purpose: `Policy<M>`, the kind base of a model's record rules: `class OrderPolicy extends Policy<Order>` in a
 *          module's `access/<model>.policy.ts`, whose methods are named after the verbs of its permission set and
 *          answer `Decision.Allow`, `Decision.Deny` or `Decision.Abstain` for one actor and one record.
 * Boundary: bare with the model as the type argument, or called with options when the permission set's stem differs
 *           (`Policy<StockLevel>({ permissions: StockPermissions })`); the type argument is gone at runtime, so gen
 *           pairs the model and the policy through `registerPolicies`. A binding with constructor dependencies, wired
 *           by gen and never constructed by an author (ADR 0328 decision 5). A method is pure (no writes, no network)
 *           and runs inside `handle` through `ctx.authorize(record)`, after the permission step passed. `@Policy` is
 *           retired. `PolicyBase` is the file-local instance base; the file exports `Policy`, the type and the kind
 *           of one name.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294 and 0263); ADR 0305 (rules 2, 5 to 7 and 44); ADR 0294 (decisions
 *                     16 and 25).
 */
import { createKind, kindOf, type WithPartner } from "@stackra/container";

import type { PolicyOptions } from "#core/types/policy-options.type";

/** The instance side every policy shares. */
abstract class PolicyBase<M extends object> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a policy. */
  declare protected readonly "~kind": "policy";

  /** Type-only: the model the policy judges, so `Policy<Order>` and `Policy<Product>` stay distinct. */
  declare protected readonly "~model"?: M;
}

/** A policy instance of model `M`. */
export type Policy<M extends object = object> = PolicyBase<M>;

/** The two forms: bare with the model as type argument, or called with options. */
type PolicyKind = (abstract new <M extends object>() => PolicyBase<M>) &
  (<M extends object = never>(
    options: WithPartner<
      M,
      PolicyOptions,
      "Name the model as a type argument: Policy<Order>({ permissions })"
    >,
  ) => abstract new () => PolicyBase<M>);

/**
 * Checks the options of the called form.
 *
 * @throws TypeError when `permissions` is not a class that extends `Permissions`.
 */
function read(options: PolicyOptions = {}) {
  const { permissions } = options;
  if (permissions === undefined) return {};
  if (kindOf(permissions)?.kind !== "permissions")
    throw new TypeError("Policy({ permissions }) takes a class that extends Permissions");
  return { permissions };
}

/**
 * The policy kind base.
 *
 * @example
 * export class OrderPolicy extends Policy<Order> {
 *   read(actor: Actor, order: Order): Decision {
 *     const subject = actor.onBehalfOf ?? actor;
 *     return subject.realm === Realm.Customer && order.customerId !== subject.id ? Decision.Deny : Decision.Abstain;
 *   }
 * }
 */
export const Policy = createKind("policy", PolicyBase, read) as PolicyKind;
