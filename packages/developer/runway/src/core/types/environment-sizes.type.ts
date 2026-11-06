/**
 * Stackra file contract:
 * Purpose: `EnvironmentSizes`, the sizes one environment runs at: its tier, the compute of each task, the shared
 *          database, cache and NAT gateways, after the environment's own `shared` keys override its tier's.
 * Boundary: type only; `TIER_SIZES` holds one per tier and `environmentSizesOf` resolves one environment's.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; ADR 0238 (one database server per environment).
 */
import type { CacheMode } from "#core/enums/cache-mode.enum";
import type { EnvironmentTier } from "#core/enums/environment-tier.enum";

/** What one environment runs at. */
export interface EnvironmentSizes {
  /** The tier the sizes start from. */
  readonly tier: EnvironmentTier;
  /** Each service task (Fargate, Arm) and how many run. */
  readonly compute: {
    /** Fewest tasks. */
    readonly min: number;
    /** Most tasks. */
    readonly max: number;
    /** vCPU per task. */
    readonly cpu: number;
    /** Memory per task, in GB. */
    readonly memoryGb: number;
  };
  /** The one Postgres server of the environment. */
  readonly database: {
    /** An RDS instance class (or a Cloud SQL tier on ksa). */
    readonly class: string;
    /** Whether a standby runs in a second zone. */
    readonly multiAz: boolean;
    /** Allocated storage, in GB. */
    readonly storageGb: number;
  };
  /** The shared cache. */
  readonly cache: {
    /** Serverless, or fixed nodes. */
    readonly mode: CacheMode;
    /** The node class when `mode` is nodes, else null. */
    readonly class: string | null;
    /** The node count when `mode` is nodes, else null. */
    readonly nodes: number | null;
  };
  /** Outbound internet. */
  readonly network: {
    /** NAT gateways, one per zone at most. */
    readonly natGateways: number;
  };
}
