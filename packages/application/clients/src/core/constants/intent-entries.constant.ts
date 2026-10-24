/**
 * Stackra file contract:
 * Purpose: `INTENT_ENTRIES`, the intents of the generated `#stackra/intents` table, in declaration order, which
 *          `useIntentRouter` matches free text against.
 * Boundary: filled by `intents([...])` when the generated table loads; a second call replaces the first table. Not
 *           exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (intents); owner decision R-12.
 */
import type { IntentEntry } from "#core/types/intent-entry.type";

/** The loaded intent table. */
export const INTENT_ENTRIES: IntentEntry[] = [];
