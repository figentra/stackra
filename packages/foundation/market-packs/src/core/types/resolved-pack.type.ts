/**
 * Stackra file contract:
 * Purpose: `ResolvedPack`, the pack versions that answer for one market: the root market first, each overlay after its
 *          parent, each market's base pack followed by the requested product sections.
 * Boundary: a type only; `resolvePack` builds it and the value functions read it. A later layer wins for a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 3 and 4).
 */
import type { MarketPack } from "#core/types/market-pack.type";

/** The layers of one market. */
export type ResolvedPack = {
  /** The market asked for. */
  readonly market: string;
  /** Root first, the market asked for last. */
  readonly layers: readonly MarketPack[];
};
