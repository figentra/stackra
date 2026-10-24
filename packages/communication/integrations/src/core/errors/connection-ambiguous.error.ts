/**
 * Stackra file contract:
 * Purpose: `ConnectionAmbiguousError` (`connection_ambiguous`), the refusal of `ConnectionStore#find` when the first
 *          level that holds a connection of an integration with `multiple: true` holds more than one.
 * Boundary: kind `Conflict`, never retryable; the caller picks one with `byId` or `list`. Its details are the
 *           integration's key and the level, never a connection's fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 10); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** More than one connection answers the lookup. */
export class ConnectionAmbiguousError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The integration's key (`messages.resend`). */
  integration!: string;

  /** The level that holds several (`scope`). */
  level!: string;
}
