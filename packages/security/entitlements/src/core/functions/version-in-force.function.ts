/**
 * Stackra file contract:
 * Purpose: `versionInForce`, the version of a catalogue record a term uses: the approved version with the latest date
 *          at or before the term's start, the highest number winning a tie. A subscription passes the start of its
 *          current term, so a change dated after that start reaches it at its next renewal.
 * Boundary: pure; pending and rejected versions never count. `undefined` when no approved version applies yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 3); owner OS-82 (price changes at renewal).
 */
import { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";
import type { CatalogueVersion } from "#contracts/types/catalogue-version.type";

/**
 * The version of `versions` in force for a term starting at `termStart`.
 *
 * @example
 * versionInForce(await store.list("price-list:commerce"), subscription.currentTermStart);
 */
export function versionInForce(
  versions: readonly CatalogueVersion[],
  termStart: Date,
): CatalogueVersion | undefined {
  let found: CatalogueVersion | undefined;
  for (const candidate of versions) {
    if (candidate.state !== CatalogueVersionState.Approved) continue;
    if (candidate.effectiveFrom.getTime() > termStart.getTime()) continue;
    if (
      found === undefined ||
      candidate.effectiveFrom.getTime() > found.effectiveFrom.getTime() ||
      (candidate.effectiveFrom.getTime() === found.effectiveFrom.getTime() &&
        candidate.version > found.version)
    )
      found = candidate;
  }
  return found;
}
