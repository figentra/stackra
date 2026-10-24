/**
 * Stackra file contract:
 * Purpose: `Timestamps`, the trait that records when a row was created and last updated.
 * Boundary: both fields start at the creation time (the initializers run for `em.create`, never for a loaded row);
 *           gen gives `updatedAt` the ORM's on-update hook, so every flush that changes the row moves it.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decision 4); ADR 0294 (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The timestamps trait.
 *
 * @example
 * export class Variant extends Model.with(HasPublicId("var"), BelongsToTenant, Timestamps) {}
 */
export const Timestamps: Trait<{ createdAt: Date; updatedAt: Date }> = createTrait(
  "timestamps",
  (base) =>
    class extends base {
      /** When the row was created. */
      createdAt: Date = new Date();

      /** When the row last changed. */
      updatedAt: Date = new Date();
    },
);
