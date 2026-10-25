/**
 * Stackra file contract:
 * Purpose: `VerificationRequest`, one KYC or KYB check asked of a provider: its kind, the market whose pack picks the
 *          provider, the caller's idempotency reference, the facts to check and the subject's consent.
 * Boundary: a type only. The facts are what the kind needs (a national ID number, a registration number, a name and a
 *           date of birth), already format-checked by `@stackra/validation`; they are personal data, so a driver sends
 *           them to its provider only and never logs them.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54, OS-56 (verification reused on consent).
 */
import type { Json } from "@stackra/contracts";

import type { VerificationKind } from "#contracts/enums/verification-kind.enum";

/** One check. */
export interface VerificationRequest {
  /** What the check proves. */
  readonly kind: VerificationKind;

  /** The market code whose pack names the providers (`sa`, `ae-difc`). */
  readonly market: string;

  /** The caller's reference, unique per check, so a retried call never checks twice. */
  readonly reference: string;

  /** The facts to check, by the provider-neutral names the kind uses. */
  readonly subject: Readonly<Record<string, Json>>;

  /** The subject consented to the check (required where the pack says so). */
  readonly consented: boolean;
}
