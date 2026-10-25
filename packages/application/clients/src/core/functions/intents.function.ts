/**
 * Stackra file contract:
 * Purpose: `intents`, what gen calls in `#stackra/intents` with every intent the consumed actions and queries offer:
 *          it records the table that `useIntentRouter` matches free text against and returns it frozen.
 * Boundary: data only; a later call replaces the table. The phrases stay in the producers' lang files, so every locale
 *           has its own; a proposed action still runs through its declared confirmation.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (intents); owner decision R-12 (`intent` opt-in); ADR 0139 (confirmation).
 */
import { INTENT_ENTRIES } from "#core/constants/intent-entries.constant";
import type { IntentEntry } from "#core/types/intent-entry.type";

/**
 * Records the intent table.
 *
 * @example
 * export const Intents = intents([
 *   { ref: CreateOrderAction, phrases: I18n.orders.actions.order.create.intents, icon: Icons.ShoppingCart },
 * ]);
 */
export function intents(entries: readonly IntentEntry[]): readonly IntentEntry[] {
  const table = Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
  INTENT_ENTRIES.splice(0, INTENT_ENTRIES.length, ...table);
  return table;
}
