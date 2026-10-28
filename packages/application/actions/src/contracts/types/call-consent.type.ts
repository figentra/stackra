/**
 * Stackra file contract:
 * Purpose: `CallConsent`, the visitor's consent as one call carries it (ADR 0472): either a verified snapshot (its id,
 *          its subject, the categories it grants and when it expires) or a refusal with its reason.
 * Boundary: a type only, what `ctx.consent()` resolves to and a `ConsentCheck` answers. `granted` is the list of
 *           category codes (`analytics`, `marketing`, ...); it is empty whenever `verified` is false, so a sender can
 *           always test `granted.includes(category)` and a missing snapshot reads as refused. Holds no personal data
 *           beyond the subject id (the analytics anonymous id, the principal, or a random id).
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 2 to 5); ADR 0136 (decision 1: the handler context).
 */
import type { ConsentRefusal } from "#contracts/enums/consent-refusal.enum";

/** A verified consent snapshot. */
interface VerifiedCallConsent {
  /** A valid, trusted, current snapshot was presented. */
  readonly verified: true;

  /** The snapshot's id; an event derived from the call carries it, so a relay and an audit see the same decision. */
  readonly snapshotId: string;

  /** Who the snapshot was issued for: the analytics anonymous id, the principal, or a random id. */
  readonly subject: string;

  /** The category codes the visitor granted; a required category (`necessary`) is always among them. */
  readonly granted: readonly string[];

  /** When the snapshot stops counting. */
  readonly expiresAt: Date;
}

/** Consent that does not count, and why. */
interface RefusedCallConsent {
  /** No valid snapshot: every optional category reads as refused. */
  readonly verified: false;

  /** Why it does not count. */
  readonly refusal: ConsentRefusal;

  /** Always empty: nothing is granted without a verified snapshot. */
  readonly granted: readonly string[];
}

/** The consent one call carries. */
export type CallConsent = VerifiedCallConsent | RefusedCallConsent;
