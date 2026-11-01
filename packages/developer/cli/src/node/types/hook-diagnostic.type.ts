/**
 * Stackra file contract:
 * Purpose: `HookDiagnostic`, the fields of one oxlint `-f json` diagnostic the `hooks` phase reads.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 41).
 */

/** One oxlint diagnostic, as far as the `hooks` phase reads it. */
export type HookDiagnostic = {
  /** The rule's message. */
  readonly message: string;

  /** The linted file, as oxlint printed it. */
  readonly filename?: string;

  /** The marked spans; the first one's line is the finding's line. */
  readonly labels?: readonly { readonly span?: { readonly line?: number } }[];
};
