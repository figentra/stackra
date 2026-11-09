/**
 * Stackra file contract:
 * Purpose: `TIER_SIZES`, the sizes behind each `EnvironmentTier`, from the finance tiers (the cost plan of
 *          2026-11-06): the defaults an environment runs at until its own `shared` keys say otherwise.
 * Boundary: data only; `environmentSizesOf` reads it. Settings, not owner questions: a product changes its own
 *           environment's keys, and a change here moves every product that keeps the default. No cache class here is
 *           a t4g or m6g node, which the UAE region (me-central-1) does not offer.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; ADR 0004 (year-1 load).
 */
import { CacheMode } from "#core/enums/cache-mode.enum";
import { EnvironmentTier } from "#core/enums/environment-tier.enum";
import type { EnvironmentSizes } from "#core/types/environment-sizes.type";

/** One size set per tier. */
export const TIER_SIZES: Readonly<Record<EnvironmentTier, EnvironmentSizes>> = {
  [EnvironmentTier.Staging]: {
    tier: EnvironmentTier.Staging,
    compute: { min: 1, max: 1, cpu: 0.25, memoryGb: 0.5 },
    database: { class: "db.t4g.micro", multiAz: false, storageGb: 20 },
    cache: { mode: CacheMode.Serverless, class: null, nodes: null },
    network: { natGateways: 1 },
  },
  [EnvironmentTier.Launch]: {
    tier: EnvironmentTier.Launch,
    compute: { min: 2, max: 2, cpu: 0.5, memoryGb: 1 },
    database: { class: "db.t4g.medium", multiAz: true, storageGb: 50 },
    cache: { mode: CacheMode.Serverless, class: null, nodes: null },
    network: { natGateways: 1 },
  },
  [EnvironmentTier.Growth]: {
    tier: EnvironmentTier.Growth,
    compute: { min: 2, max: 10, cpu: 1, memoryGb: 2 },
    database: { class: "db.m7g.large", multiAz: true, storageGb: 200 },
    cache: { mode: CacheMode.Nodes, class: "cache.m7g.large", nodes: 2 },
    network: { natGateways: 3 },
  },
};
