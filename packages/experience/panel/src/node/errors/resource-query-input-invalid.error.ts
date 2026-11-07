/**
 * Stackra file contract:
 * Purpose: `ResourceQueryInputInvalidError`, the refusal of a generated list read given a sort key, a filter key or a
 *          search its resource table does not declare.
 * Boundary: a refusal; built with `create`. It names the query and the offending key, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: no raw field name reaches SQL); ADR 0140 (refusals); STA-1971.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A list read's input names a key its table does not declare. */
export class ResourceQueryInputInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The query key. */
  query!: string;

  /** Where the key was given: `sort`, `filter` or `search`. */
  part!: string;

  /** The undeclared key (`search` for a search on a table without one). */
  key!: string;
}
