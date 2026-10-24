/**
 * Stackra file contract:
 * Purpose: `UserStamps`, the trait that records which principal created a row and which last updated it.
 * Boundary: both fields hold principal public ids and start as `null`; the unit of work fills them from the call's
 *           actor, never from input. A row written by the system keeps `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0133 (decision 7: user stamps); ADR 0294 (decision 27); ADR 0082 (public ids only).
 */
import type { PublicId } from "@stackra/contracts";

import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The user-stamps trait.
 *
 * @example
 * export class Order extends Model.with(HasPublicId("ord"), BelongsToTenant, Timestamps, UserStamps) {}
 */
export const UserStamps: Trait<{ createdBy: PublicId | null; updatedBy: PublicId | null }> =
  createTrait(
    "user_stamps",
    (base) =>
      class extends base {
        /** The principal who created the row; null for a system write. */
        createdBy: PublicId | null = null;

        /** The principal who last changed the row; null for a system write. */
        updatedBy: PublicId | null = null;
      },
  );
