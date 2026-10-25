/**
 * Stackra file contract:
 * Purpose: `Licence`, what `verifyLicenceFile` reads from a verified Keygen licence file: the licence's limits and
 *          expiry, the file's own issue and expiry times, and the entitlement codes an on-prem install reads.
 * Boundary: a type only. It never carries the licence key; it holds only what the signed file states.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 and 6, EN6).
 */
import type { Json } from "@stackra/contracts";

/** A verified licence. */
export interface Licence {
  /** Keygen's licence id. */
  readonly id: string;

  /** The licence's name, when Keygen has one. */
  readonly name: string | undefined;

  /** Keygen's status when the file was issued (`ACTIVE`, `EXPIRING`, `EXPIRED`, `SUSPENDED`, `BANNED`, ...). */
  readonly status: string;

  /** When the licence expires; `undefined` for a licence that never does. */
  readonly expiry: Date | undefined;

  /** When Keygen issued this file. */
  readonly issued: Date;

  /** When this file stops counting (Keygen's check-out TTL); `undefined` for a file without one. */
  readonly fileExpiry: Date | undefined;

  /** The machine limit; `undefined` when unlimited. */
  readonly maxMachines: number | undefined;

  /** The seat (user) limit; `undefined` when unlimited. */
  readonly maxUsers: number | undefined;

  /** The entitlement codes the file includes; empty when it was checked out without them. */
  readonly entitlements: readonly string[];

  /** The licence's metadata as Keygen holds it. */
  readonly metadata: Readonly<Record<string, Json>>;
}
