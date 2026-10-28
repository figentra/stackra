/**
 * Stackra file contract:
 * Purpose: `CacheScope`, whom one cached query result is shared with: the principal that asked (the default), every
 *          caller in the call's scope node, or every caller of one site (the public key of ADR 0297 decision 3).
 * Boundary: an enum (`Enum.of`) read by `Query({ cache: { per } })`, the pipeline's cache step (the key) and gen's
 *           `site_cache_reads_caller` check. Named after the scope, never the tenant (R-59, ADR 0323).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31, as amended 2026-10-28: `CacheScope.{Principal, Scope, Site}`); ADR 0297
 *                     (decision 3); owner decision 4 of the data-layer gap analysis (2026-10-28).
 */
import { Enum } from "@stackra/contracts";

/**
 * Whom a cached query result is shared with.
 *
 * @example
 * Query({ key: "catalog.price_list.get", actors, cache: { ttl: "5m", per: CacheScope.Scope } });
 */
export const CacheScope = Enum.of({
  /** The default: one entry per caller (the actor and whom it acts for). */
  Principal: "principal",
  /** One entry per scope node: the result must not depend on who asks (`expectScopeCacheSafe`). */
  Scope: "scope",
  /** One entry per site (the call origin's id): public data that never reads the caller (`site_cache_reads_caller`). */
  Site: "site",
});

/** One of the values above. */
export type CacheScope = Enum.Value<typeof CacheScope>;
