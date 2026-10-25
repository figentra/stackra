/**
 * Stackra file contract:
 * Purpose: `pickPack`, the one version of a market's base pack or product section that a resolution serves: the
 *          highest version with an accepted status that the pin allows.
 * Boundary: pure and internal (used by `resolvePack`). A pin without a dot is a major line; a pin with dots is one exact
 *           version (a rollback). Returns `undefined` when nothing fits.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 4).
 */
import type { PackStatus } from "#core/enums/pack-status.enum";
import { compareVersions } from "#core/functions/compare-versions.function";
import type { MarketPack } from "#core/types/market-pack.type";

/**
 * The version to serve.
 *
 * @example
 * pickPack(packs, "eu", undefined, "2", [PackStatus.Live]);
 */
export function pickPack(
  packs: readonly MarketPack[],
  market: string,
  section: string | undefined,
  pin: string | undefined,
  statuses: readonly PackStatus[],
): MarketPack | undefined {
  let best: MarketPack | undefined;
  for (const pack of packs) {
    if (pack.market !== market || pack.section !== section || !statuses.includes(pack.status))
      continue;
    if (
      pin !== undefined &&
      (pin.includes(".") ? pack.version : pack.version.split(".")[0]) !== pin
    )
      continue;
    if (best === undefined || compareVersions(pack.version, best.version) > 0) best = pack;
  }
  return best;
}
