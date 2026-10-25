/**
 * Stackra file contract:
 * Purpose: `DeviceSequence`, what a `DeviceSequenceStore` keeps per device: the last sequence the server settled
 *          (applied or rejected), when, and the scope node that call acted in.
 * Boundary: a type only. The scope lets a reader show a device's last acknowledged sequence only to callers whose scope
 *           holds it; it is the scope of the latest settled call.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4: per-device order; the server lists the last acknowledged sequence).
 */
import type { ScopeRef } from "@stackra/contracts";

/** A device's last settled call. */
export interface DeviceSequence {
  /** The device's id. */
  readonly deviceId: string;

  /** The highest sequence applied or rejected, a whole number from 1. */
  readonly sequence: number;

  /** When it was settled. */
  readonly settledAt: Date;

  /** The scope node the settled call acted in; absent for a platform call. */
  readonly scope?: ScopeRef;
}
