/**
 * Stackra file contract:
 * Purpose: `AuditProofReport`, what `verifyAuditProof` found in a proof bundle: how many links and signed checkpoints
 *          it checked, whether the signatures were checked against the caller's own keys, the first sequence where
 *          the chain breaks, and every problem by line.
 * Boundary: a type only; the command prints it. Problems name lines, sequences and key ids, never record content.
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3: `stackra audit:verify`); ADR 0416.
 */

/** The result of one proof-bundle check. */
export type AuditProofReport = {
  /** True when no problem was found. */
  readonly ok: boolean;
  /** The chain links checked. */
  readonly links: number;
  /** The checkpoints whose signature verified. */
  readonly signedCheckpoints: number;
  /** True when signatures were checked against keys the caller supplied, not keys the bundle carries. */
  readonly trustedKeys: boolean;
  /** The first sequence whose link or checkpoint does not hold; null when none. */
  readonly brokenAt: number | null;
  /** Every problem, in bundle order (`line 4: ...`). */
  readonly problems: readonly string[];
};
