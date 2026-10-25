/**
 * Stackra file contract:
 * Purpose: `AppendOnly`, the trait of a ledger-like model: rows are inserted and never updated; a correction is a new
 *          row.
 * Boundary: adds no field; it is a marker in the trait registry. @stackra/database reads it with `traitsOf` and
 *           refuses an update of such a row, and the migration revokes `UPDATE` on the table.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (data invariants); ADR 0096 (decision 4); ADR 0220 (the ledger is append-only).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The append-only trait.
 *
 * @example
 * export class LedgerEntry extends Model.with(HasPublicId("lpe"), AppendOnly) {}
 */
export const AppendOnly: Trait = createTrait("append_only", (base) => class extends base {});
