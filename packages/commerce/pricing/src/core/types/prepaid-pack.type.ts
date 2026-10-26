/**
 * Stackra file contract:
 * Purpose: `PrepaidPack`, one prepaid pack of a rate card: a number of units of one meter sold at one price.
 * Boundary: a type only; `rate-card:<name>` data. Auto top-up and the monthly cap are tenant settings (OS-73).
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2 (OS-73).
 */
import type { Money } from "@stackra/money";

/** One prepaid pack. */
export interface PrepaidPack {
  /** The meter key. */
  readonly meter: string;

  /** Units in the pack. */
  readonly units: number;

  /** The pack's price. */
  readonly price: Money;
}
