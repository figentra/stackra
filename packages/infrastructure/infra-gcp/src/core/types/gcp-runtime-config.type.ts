/**
 * Stackra file contract:
 * Purpose: `GcpRuntimeConfig`, the typed config of one deployment's GCP runtime stack, derived from the root runway by
 *          `gcpRuntimeConfig` and read by `gcpRuntime`: the deployment, its Cloud SQL Postgres server with its
 *          backups, point-in-time recovery, pgaudit and the slow-statement log, and its shared Memorystore for Valkey
 *          cache.
 * Boundary: type only; plain JSON. The VPC may still be `ref:<path>`; no value is a secret (Cloud SQL users are made
 *           by the database stack's IAM sign-in, not here).
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (open question 1 answered for the database only), ADR 0186 (backups in the region),
 *                     ADR 0238 (one database server per environment), ADR 0401, ADR 0212 (decision 5: pgaudit), STA-1400
 *                     (slow-statement log), ADR 0296 (decisions 1 and 5: the shared Valkey cache).
 */
import type { CacheEviction } from "@stackra/runway";

import type { MEMORYSTORE_NODE_TYPES } from "#core/constants/memorystore-node-types.constant";
import type { GcpDeployment } from "#core/types/gcp-deployment.type";

/** One deployment's GCP runtime. */
export type GcpRuntimeConfig = GcpDeployment & {
  /** The Postgres server, or `null` when the environment declares no `shared.database`. */
  readonly database: {
    /** The Cloud SQL machine tier (`db-custom-2-7680`). */
    readonly tier: string;
    /** The Cloud SQL Postgres version (`POSTGRES_17`). */
    readonly version: string;
    /** A standby in a second zone. */
    readonly highAvailability: boolean;
    /** Daily backups kept, or `null` for Cloud SQL's default count. */
    readonly retainedBackups: number | null;
    /** Point-in-time recovery: the days of transaction log kept (`null` for Cloud SQL's default), or `false` when off. */
    readonly pitr: { readonly days: number | null } | false;
    /**
     * pgaudit: the statement classes logged server-wide and the days its log bucket keeps them, or `false` when the
     * runway turns it off.
     */
    readonly pgaudit: { readonly log: readonly string[]; readonly retentionDays: number } | false;
    /**
     * The milliseconds from which the server logs a statement and its plan (`log_min_duration_statement`,
     * `auto_explain`), or `false` when the runway turns the slow-statement log off.
     */
    readonly slowQueryMs: number | false;
    /** The VPC the server joins on a private IP (`ref:<path>`), or `null` to reach it only through the connector. */
    readonly network: string | null;
  } | null;
  /** The shared Valkey cache, or `null` when the environment's `shared.cache.engine` is not `valkey`. */
  readonly cache: {
    /** The Memorystore node type (`SHARED_CORE_NANO`). */
    readonly node: (typeof MEMORYSTORE_NODE_TYPES)[number];
    /** Shards; one runs the instance with cluster mode off, more turn it on. */
    readonly shards: number;
    /** Replicas per shard; at least one spreads the nodes across zones. */
    readonly replicas: number;
    /** The `maxmemory-policy`, or `null` for the engine's default. */
    readonly eviction: CacheEviction | null;
    /** `iam`: clients sign in with an IAM access token; `none`: anyone on the VPC reaches it. */
    readonly auth: "iam" | "none";
    /** The VPC the instance's Private Service Connect endpoints join (`ref:<path>`). */
    readonly network: string;
    /** The subnet a new `gcp-memorystore` connection policy reserves addresses in, or `null` when the VPC has one. */
    readonly subnet: string | null;
  } | null;
};
