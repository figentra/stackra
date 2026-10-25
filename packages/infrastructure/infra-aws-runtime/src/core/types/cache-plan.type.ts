/**
 * Stackra file contract:
 * Purpose: `CachePlan`, one Valkey cache of a runtime plan: the environment's shared cache (root
 *          `shared.cache.engine: valkey`) or a member's dedicated one (`requires.<name>` with `engine: valkey` and
 *          `dedicated: true`, where its cache driver is `valkey`), with its node type, replica count and eviction.
 * Boundary: type only; data, no Pulumi type.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1, 2 and 5: dedicated resources, shared pools, engines), ADR 0172.
 */
import type { CacheEviction } from "@stackra/runway";

/** One cache. */
export type CachePlan = {
  /** `shared`, or `<member>.<requirement>` for a dedicated cache (`commerce.cache`). */
  readonly key: string;
  /** The ElastiCache replication group id (40 characters at most), also its parameter group's name. */
  readonly name: string;
  /** The ElastiCache node type (`cache.t4g.small`). */
  readonly nodeType: string;
  /** Read replicas beside the primary; failover and Multi-AZ are on when there is at least one. */
  readonly replicas: number;
  /** The `maxmemory-policy`; the engine's default parameter group when absent. */
  readonly eviction?: CacheEviction | undefined;
  /** `env`, `service` (`shared` for the shared cache) and, for a placed member, `group`. */
  readonly tags: Readonly<Record<string, string>>;
};
