/**
 * Stackra file contract:
 * Purpose: `POSTGRES_SIZES`, what each `ResourceSize` of a Postgres resource is: the RDS instance class, Multi-AZ, the
 *          allocated storage and a monthly estimate in US dollars that includes RDS Proxy. `small` is the smallest
 *          Graviton class, single-AZ (owner, 2026-10-30).
 * Boundary: data only; `runtimePlan` reads it. The estimates are on-demand list prices rounded up, not a bill.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3, owner answer Q7), ADR 0238 (RDS by default), ADR 0473 (RDS Proxy).
 */

/** The instance class, zones, storage and estimate of each Postgres size. */
export const POSTGRES_SIZES = Object.freeze({
  /** The smallest Graviton class, single-AZ: dev's default. */
  small: { instanceClass: "db.t4g.micro", multiAz: false, storageGb: 20, monthlyUsd: 45 },
  /** A burstable Graviton medium, single-AZ. */
  medium: { instanceClass: "db.t4g.medium", multiAz: false, storageGb: 50, monthlyUsd: 100 },
  /** A memory-optimised Graviton large with a standby in a second zone. */
  large: { instanceClass: "db.r7g.large", multiAz: true, storageGb: 100, monthlyUsd: 450 },
} as const);
