/**
 * Stackra file contract:
 * Purpose: `BindRef`, a value bound at render time instead of written: the record's field, the dashboard's range, the
 *          table's filter or the signed-in actor's field (`record.totals.currency`).
 * Boundary: a type only: a branded string, so a bind cannot be confused with a literal path. `Bind` builds them; gen
 *           fails `bind_place_invalid` on a record bind outside a View slot or a filter bind outside a List slot.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18: `Bind.record` only in a View slot, `Bind.tableFilter` only in a List slot).
 */
import type { Branded } from "@stackra/contracts";

/** A source the renderer reads a value from. */
export type BindRef = Branded<string, "panel.BindRef">;
