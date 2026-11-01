/**
 * Stackra file contract:
 * Purpose: `ApprovalExecution`, how a granted request runs: `on_grant` (the owning service executes it as the
 *          requester when the last vote lands; a declared stage) or `on_resubmit` (the requester resubmits with the id;
 *          a request parked only by tenant rules).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry; snake_case machine codes (ADR 0231).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (execute on grant, L-04); STA-1724 FR-007, FR-013; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The execution modes of an approval request.
 *
 * @example
 * const execute = declared ? ApprovalExecution.OnGrant : ApprovalExecution.OnResubmit;
 */
export const ApprovalExecution = Enum.of({
  /** The owning service runs the call when the request is granted. */
  OnGrant: "on_grant",
  /** The requester resubmits the call with the approval id. */
  OnResubmit: "on_resubmit",
});

/** One of the codes above. */
export type ApprovalExecution = Enum.Value<typeof ApprovalExecution>;
