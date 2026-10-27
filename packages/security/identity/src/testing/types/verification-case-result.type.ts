/**
 * Stackra file contract:
 * Purpose: `VerificationCaseResult`, what `runVerificationCase` reports: the case, the driver's answer (none when it
 *          refused or does not support the kind) and every expectation or port rule it missed.
 * Boundary: a type only, in the `./testing` entry. A mismatch names the rule, never a subject fact.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); ADR 0269 (decision 3); owner decision D3 (2026-10-27).
 */
import type { VerificationResult } from "#contracts/index";

/** The outcome of one recorded case. */
export interface VerificationCaseResult {
  /** The case's id. */
  readonly caseId: string;

  /** The driver's answer; `null` when it refused or does not support the kind. */
  readonly answer: Omit<VerificationResult, "provider"> | null;

  /** Every miss; empty when the driver passes the case. */
  readonly mismatches: readonly string[];
}
