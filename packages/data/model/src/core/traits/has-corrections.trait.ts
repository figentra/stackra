/**
 * Stackra file contract:
 * Purpose: `HasCorrections`, the correction chain of an `AppendOnly` model: a correction is a new row whose `corrects`
 *          names the row it corrects; the original stays, and a correction of a correction chains. Time entries, money
 *          and decisions use it.
 * Boundary: adds the field only; it is applied with `AppendOnly`, never alone. Reads resolve to the latest correction
 *           with `currentRows` unless history is asked for. Kept apart from `AppendOnly` so the append-only tables
 *           that exist today keep their columns.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (2026-10-24 amendment: the correction chain); ADR 0134 (data invariants).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The correction-chain trait.
 *
 * @example
 * export class TimeEntry extends Model.with(HasPublicId("tme"), AppendOnly, HasCorrections) {}
 */
export const HasCorrections: Trait<{ corrects: string | null }> = createTrait(
  "has_corrections",
  (base) =>
    class extends base {
      /** The id of the row this one corrects; null for an original row. */
      corrects: string | null = null;
    },
);
