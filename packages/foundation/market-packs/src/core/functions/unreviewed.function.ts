/**
 * Stackra file contract:
 * Purpose: `unreviewed`, the entry keys of one pack version that no reviewer has signed off in that version: what
 *          stands between a draft and its signature.
 * Boundary: pure. A sign-off is per key and per version; who may review is the caller's access rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 8).
 */
import type { MarketPack } from "#core/types/market-pack.type";

/**
 * The keys of `pack` with no sign-off, in entry order, each once.
 *
 * @example
 * unreviewed(draft); // ["tax.vat.standard"]
 */
export function unreviewed(pack: MarketPack): readonly string[] {
  const reviewed = new Set(pack.reviews.map((review) => review.key));
  return [...new Set(pack.entries.map((entry) => entry.key))].filter((key) => !reviewed.has(key));
}
