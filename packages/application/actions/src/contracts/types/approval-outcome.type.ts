/**
 * Stackra file contract:
 * Purpose: `ApprovalOutcome`, how an execution ended, as `ApprovalGate.settle` records it: `executed`, `failed`
 *          with the refusal's code, or `unknown` for a request still `executing` past its window.
 * Boundary: a type only. An error that is not a refusal is no outcome: the request stays `executing` for a retry.
 *           `unknown` is only for a request `executing` 24 hours after its grant; operators decide it and nothing
 *           retries it.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (settle); STA-1724 FR-012.
 */

/** The end of one execution. */
export type ApprovalOutcome =
  | { readonly status: "executed" }
  | { readonly status: "failed"; readonly code: string }
  | { readonly status: "unknown" };
