/**
 * Stackra file contract:
 * Purpose: `Versioned`, the trait of optimistic concurrency: a `version` the ORM checks and raises on every update,
 *          so a stale write fails with the `conflict` refusal instead of overwriting a newer one.
 * Boundary: adds the field only; gen marks it as the ORM's version property. History is `HasRevisions` or the audit
 *           log, never this trait.
 * Runtime: isomorphic
 * Governing contract: ADR 0133 (decision 6: optimistic concurrency, 409 `conflict`); ADR 0294 (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The optimistic-version trait.
 *
 * @example
 * export class StockLevel extends Model.with(HasPublicId("stk"), Versioned) {}
 */
export const Versioned: Trait<{ version: number }> = createTrait(
  "versioned",
  (base) =>
    class extends base {
      /** The row version; 1 when created, raised by the ORM on each update. */
      version = 1;
    },
);
