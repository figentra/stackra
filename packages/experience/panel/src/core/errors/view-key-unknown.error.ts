/**
 * Stackra file contract:
 * Purpose: `ViewKeyUnknownError` (`view_key_unknown`), the refusal of a saved view that names a column, filter, sort,
 *          group, total or layout path the resource does not declare, or a resource with no recorded table.
 * Boundary: a refusal (`validation`), not retryable as is: the view is edited or dropped. `keys` lists every unknown key,
 *           so a renamed or removed field reports all the views it breaks.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decision 4 and its consequence: the validator reports broken views); ADR 0307 (rule 9);
 *                     ADR 0140 (refusals); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A saved view names keys its resource does not declare. */
export class ViewKeyUnknownError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The resource key the view targets. */
  resource!: string;

  /** The undeclared keys, in the order the view names them. */
  keys!: readonly string[];
}
