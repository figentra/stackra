/**
 * Stackra file contract:
 * Purpose: `SecondApproverRequiredError`, the refusal of a discount approved by the person who proposed it
 *          (`second_approver_required`).
 * Boundary: kind `Forbidden` (HTTP 403), not retryable. Its details name the record key and version only.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0391 (decision 4); owner OS-381.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A discount needs someone else to approve it.
 *
 * @example
 * throw SecondApproverRequiredError.create({ key: "offer:founding", version: 3 });
 */
export class SecondApproverRequiredError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The record key. */
  key!: string;

  /** The version waiting for approval. */
  version!: number;
}
