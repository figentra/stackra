/**
 * Stackra file contract:
 * Purpose: `environmentSizesOf(root, environment)`, the sizes one environment of a parsed root runway runs at: its
 *          tier's `TIER_SIZES` (production defaults to launch, every other environment to staging), with the
 *          environment's own `shared.database`, `shared.cache` and `shared.network` keys written over them.
 * Boundary: pure; it reads the runway and returns plain values for figentra/infra, `runway plan` and the cost
 *           report. Encore Cloud applies the database, cache and compute sizes from its dashboard, so these are the
 *           desired values a drift report compares against. Compute comes from the tier only: a topology group's
 *           own `instances`, `cpu` and `memory` stay that group's.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; ADR 0238 (one database server per environment).
 */
import { TIER_SIZES } from "#core/constants/tier-sizes.constant";
import { CacheMode } from "#core/enums/cache-mode.enum";
import { EnvironmentTier } from "#core/enums/environment-tier.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { EnvironmentSizes } from "#core/types/environment-sizes.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The sizes `environment` runs at.
 *
 * @example
 * environmentSizesOf(root, "production").database;
 * // { class: "db.t4g.medium", multiAz: true, storageGb: 50 }
 */
export function environmentSizesOf(
  root: RootRunway,
  environment: RunwayEnvironment,
): EnvironmentSizes {
  const declared = root.environments[environment];
  const tier =
    declared?.tier ??
    (environment === RunwayEnvironment.Production
      ? EnvironmentTier.Launch
      : EnvironmentTier.Staging);
  const base = TIER_SIZES[tier];
  const database = declared?.shared?.database;
  const cache = declared?.shared?.cache;
  const mode = cache?.mode ?? base.cache.mode;
  const nodes = mode === CacheMode.Nodes;
  return {
    tier,
    compute: base.compute,
    database: {
      class: database?.class ?? base.database.class,
      multiAz: database?.multiAz ?? base.database.multiAz,
      storageGb: database?.storageGb ?? base.database.storageGb,
    },
    cache: {
      mode,
      // A tier's serverless cache has no class, so switching to nodes falls back to growth's node class and count.
      class: nodes
        ? (cache?.class ?? base.cache.class ?? TIER_SIZES[EnvironmentTier.Growth].cache.class)
        : null,
      nodes: nodes
        ? (cache?.nodes ?? base.cache.nodes ?? TIER_SIZES[EnvironmentTier.Growth].cache.nodes)
        : null,
    },
    network: {
      natGateways: declared?.shared?.network?.natGateways ?? base.network.natGateways,
    },
  };
}
