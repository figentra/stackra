/**
 * Stackra file contract:
 * Purpose: `resolvePack`, the layers that answer for one market for one tenant: the market's base pack, then the pack
 *          it overlays, and so on to the root at any depth (`us-ca-sf`, `us-ca`, `us`), each chosen under the tenant's
 *          pin and accepted statuses, with the requested product sections on the same major line beside each base
 *          pack, so a section declared on an overlay (`us-ca-sf` / `restaurant`) overlays its parent's section.
 * Boundary: pure over verified packs. Refuses with `PackNotFoundError` when a market in the chain has no fitting base
 *           version, and with `PackRejectedError` (`overlay_cycle`) when the chain loops. A market with no section
 *           for a product simply adds none. Only `live` is accepted unless `statuses` says otherwise.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 3, 4 and 7) as amended by ADR 0385.
 */
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackNotFoundError } from "#core/errors/pack-not-found.error";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { pickPack } from "#core/functions/pick-pack.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { ResolveOptions } from "#core/types/resolve-options.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/**
 * Resolve `market` over `packs`.
 *
 * @example
 * const resolved = resolvePack(packs, "eu-de", { pins: { "eu-de": "2", eu: "3" }, sections: ["shop"] });
 */
export function resolvePack(
  packs: readonly MarketPack[],
  market: string,
  options: ResolveOptions = {},
): ResolvedPack {
  const statuses = options.statuses ?? [PackStatus.Live];
  const layers: MarketPack[] = [];
  const seen = new Set<string>();
  for (let next: string | undefined = market; next !== undefined;) {
    const code: string = next;
    if (seen.has(code))
      throw PackRejectedError.create({ reason: PackRejection.OverlayCycle, pack: code });
    seen.add(code);
    const pin = options.pins?.[code];
    const base = pickPack(packs, code, undefined, pin, statuses);
    if (base === undefined)
      throw PackNotFoundError.create(pin === undefined ? { market: code } : { market: code, pin });
    const major = base.version.split(".")[0];
    const sections = (options.sections ?? []).flatMap(
      (section) => pickPack(packs, code, section, major, statuses) ?? [],
    );
    layers.unshift(base, ...sections);
    next = base.extends;
  }
  return { market, layers };
}
