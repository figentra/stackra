/**
 * Stackra file contract:
 * Purpose: `stampFields(model, write)`, the `Timestamps` and `UserStamps` values a write of `model` sets: `updatedAt`
 *          now, and `updatedBy` (plus `createdBy` on a create) from the running call's actor.
 * Boundary: internal; read by `StampSubscriber` for unit-of-work writes and by `CrudService` for its native updates
 *           (`increment`, `repath`), which fire no entity event. Only the fields the model's traits declare are
 *           returned. The actor comes from the running call's `ContextStorage` through the resolver
 *           `connectVisibilityFilter` named, never from input; with no call, or a `system` actor, no principal is
 *           stamped (a system write keeps the stamps it had, `null` on a create).
 * Runtime: node
 * Governing contract: ADR 0133 (decision 7: user stamps); ADR 0096 (decision 4: traits run as ORM subscribers);
 *                     ADR 0082 (public ids only).
 */
import type { ExtensionContext } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import { traitsOf } from "@stackra/model";

import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";

/**
 * The stamp values of a write of `model`.
 *
 * @param write - `create` also sets `createdBy`; `update` sets `updatedAt` and `updatedBy` only.
 * @example
 * stampFields(Order, "update"); // { updatedAt: <now>, updatedBy: "usr_..." }
 */
export function stampFields(model: object, write: "create" | "update"): Record<string, unknown> {
  const names = new Set(traitsOf(model).map((trait) => trait.name));
  const fields: Record<string, unknown> = {};
  if (names.has("timestamps") && write === "update") fields["updatedAt"] = new Date();
  if (!names.has("user_stamps")) return fields;
  const { resolver } = VISIBILITY_HOST;
  const context = resolver?.has(ContextStorage)
    ? (resolver.get(ContextStorage).current() as ExtensionContext | undefined)
    : undefined;
  const actor = context?.actor;
  if (actor === undefined || actor.kind === ActorKind.System) return fields;
  fields["updatedBy"] = actor.id;
  if (write === "create") fields["createdBy"] = actor.id;
  return fields;
}
