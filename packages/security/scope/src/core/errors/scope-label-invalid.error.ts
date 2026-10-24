/**
 * Stackra file contract:
 * Purpose: `ScopeLabelInvalidError`, the refusal of a node whose path label breaks the label rule or, for a root,
 *          differs from `ScopeConfig.root` (`scope_label_invalid`).
 * Boundary: raised by `ScopeNodeService.add`; kind `Validation` (HTTP 400), not retryable. Its one detail is the label
 *           the caller sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 3); ADR 0140 (envelope and kinds); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: a label is 1 to 63 of `a-z`, `0-9` and `_`, and the root's is `ScopeConfig.root`.
 *
 * @example
 * throw ScopeLabelInvalidError.create({ label: "Acme EU" });
 */
export class ScopeLabelInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The label the caller sent. */
  label!: string;
}
