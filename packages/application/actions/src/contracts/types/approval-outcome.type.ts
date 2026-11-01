/**
 * Stackra file contract:
 * Purpose: `ApprovalOutcome`, how an execution ended, as `ApprovalGate.settle` records it: `executed`, or `failed`
 *          with the refusal's code.
 * Boundary: a type only. An error that is not a refusal is no outcome: the request stays `executing` for a retry.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (settle); STA-1724 FR-012.
 */

/** The end of one execution. */
export type ApprovalOutcome =
  | { readonly status: "executed" }
  | { readonly status: "failed"; readonly code: string };
