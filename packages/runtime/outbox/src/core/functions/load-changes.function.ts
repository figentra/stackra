/**
 * Stackra file contract:
 * Purpose: `loadChanges`, the load half of reading the change log across tenants: given the claimed positions in log
 *          order, it loads each consecutive run of one owner's entries in that owner's isolation and hands back every
 *          entry in claim order.
 * Boundary: isomorphic, over the `ChangeFeed` and `CallIsolation` ports. A claimed position that does not load is
 *           refused (`ClaimNotLoadedError`), never skipped, so a cursor never moves past a change nobody read; an owned
 *           entry with no isolation bound is refused by `inRowOwner`.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { CallIsolation } from "@stackra/actions/contracts";

import type { ChangeClaim, ChangeFeed, ChangeRecord } from "#contracts/index";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { inRowOwner } from "#core/functions/in-row-owner.function";

/**
 * The entries of `claims`, each loaded in its owner.
 *
 * @example
 * const records = await loadChanges(feed, isolation, await feed.claim(cursor, models, 500));
 * @throws ClaimNotLoadedError when a claimed position does not load.
 * @throws RowIsolationMissingError when an owned entry is claimed and no isolation is bound.
 */
export async function loadChanges(
  feed: ChangeFeed,
  isolation: CallIsolation | undefined,
  claims: readonly ChangeClaim[],
): Promise<readonly ChangeRecord[]> {
  const runs: ChangeClaim[][] = [];
  for (const claim of claims) {
    const last = runs.at(-1);
    if (last !== undefined && last[0]?.ownerId === claim.ownerId) last.push(claim);
    else runs.push([claim]);
  }
  const records: ChangeRecord[] = [];
  for (const run of runs) {
    const positions = run.map((claim) => claim.position);
    const loaded = new Map(
      (
        await inRowOwner(isolation, run[0]?.ownerId, positions[0] ?? "", () => feed.load(positions))
      ).map((record) => [record.position, record]),
    );
    for (const position of positions) {
      const record = loaded.get(position);
      if (record === undefined) throw ClaimNotLoadedError.create({ id: position });
      records.push(record);
    }
  }
  return records;
}
