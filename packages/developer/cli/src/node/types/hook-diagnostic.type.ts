/**
 * Stackra file contract:
 * Purpose: `HookDiagnostic`, the fields of one oxlint `-f json` diagnostic the `hooks` phase reads.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 41).
 */

/** One oxlint diagnostic, as far as the `hooks` phase reads it. */
export type HookDiagnostic = {
  readonly message: string;
  readonly filename?: string;
  readonly labels?: readonly { readonly span?: { readonly line?: number } }[];
};
