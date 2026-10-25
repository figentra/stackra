/**
 * Stackra file contract:
 * Purpose: `IntentEntry`, one intent of the generated `#stackra/intents` table: the ref it proposes, the key of its
 *          phrases in the producer's lang file, its icon and, for a query, what it opens.
 * Boundary: a type only. Kind, risk, permission and label come from the ref, so nothing is restated. The phrases key
 *           names a list of strings (`orders::actions.order.create.intents`).
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (intents); owner decision R-12 (`intent` opt-in); ADR 0139 (confirmation).
 */
import type { I18nKey } from "@stackra/i18n";

import type { CallRef } from "#core/types/call-ref.type";

/** One declared intent. */
export interface IntentEntry {
  /** The action or query the intent proposes. */
  readonly ref: CallRef;

  /** The key of the phrase list in the producer's lang file. */
  readonly phrases: I18nKey;

  /** The icon name shown beside the proposal. */
  readonly icon: string;

  /** For a query intent: the route or resource that uses the query. */
  readonly opens?: unknown;
}
