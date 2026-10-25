/**
 * Stackra file contract:
 * Purpose: `matchIntent`, the action intent whose phrases best match free text: the share of a phrase's words that the
 *          text contains, at least 60 percent, the first declared intent winning a tie.
 * Boundary: internal to `useIntentRouter`; not exported from an entry. Only action intents the session may run are
 *           considered (query intents open a route and belong to navigation). Words are compared case-folded and
 *           NFKC-normalised, split on anything that is not a letter or a digit, so Arabic and Latin phrases both match.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (intents); ADR 0139 (a proposed action still confirms).
 */
import type { I18nKey } from "@stackra/i18n";

import type { IntentEntry } from "#core/types/intent-entry.type";

/** The share of a phrase's words the text must contain. */
const THRESHOLD = 0.6;

/** The words of `text`. */
function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFKC")
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word !== ""),
  );
}

/**
 * The best action intent for `text`, or `undefined`.
 *
 * @param can - whether the session holds a permission.
 * @param phrasesOf - the phrases of a phrase-list key in the active locale.
 * @example
 * matchIntent("archive the summer dress", INTENT_ENTRIES, session.can, phrasesOf)?.ref; // ArchiveProductAction
 */
export function matchIntent(
  text: string,
  entries: readonly IntentEntry[],
  can: (permission: string) => boolean,
  phrasesOf: (key: I18nKey) => readonly string[],
): IntentEntry | undefined {
  const said = wordsOf(text);
  if (said.size === 0) return undefined;
  let best: IntentEntry | undefined;
  let bestScore = THRESHOLD;
  for (const entry of entries) {
    if (entry.ref.kind !== "action" || !can(entry.ref.permission)) continue;
    for (const phrase of phrasesOf(entry.phrases)) {
      const words = [...wordsOf(phrase)];
      if (words.length === 0) continue;
      const score = words.filter((word) => said.has(word)).length / words.length;
      if (score > bestScore || (score === bestScore && best === undefined)) {
        best = entry;
        bestScore = score;
      }
    }
  }
  return best;
}
