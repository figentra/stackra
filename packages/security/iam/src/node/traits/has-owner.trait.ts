/**
 * Stackra file contract:
 * Purpose: `HasOwner`, the trait of a model whose records have an owner or assignee: `ownerId`, the public id of the
 *          principal who owns the record. It serves "my records" (`where: { ownerId: actor.id }`), assignment and
 *          owner-based policy (a `Policy` verb that allows `record.ownerId === actor.id`).
 * Boundary: adds the field only; it is not a system field, so an assignment is an ordinary write the model's
 *           permissions and policy govern. It starts null (unassigned); a create that should own its record sets it
 *           from the actor. The column and its index are the partner macro's (`t.owner()`). Owned here (ADR 0321 d2),
 *           made with the model package's `createTrait`.
 * Runtime: node
 * Governing contract: ADR 0321 (decisions 2 and 4: `HasOwner`, owned by @stackra/iam); ADR 0294 (decision 27); ADR
 *                     0082 (public ids only); data-layer gap mo18.
 */
import type { PublicId } from "@stackra/contracts";
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The owner trait.
 *
 * @example
 * export class Ticket extends Model.with(HasPublicId("tkt"), HasOwner) {}
 * const mine = await tickets.find({ ownerId: actor.id });
 */
export const HasOwner: Trait<{ ownerId: PublicId | null }> = createTrait(
  "has_owner",
  (base) =>
    class extends base {
      /** The principal who owns or is assigned the record; null while unassigned. */
      ownerId: PublicId | null = null;
    },
);
