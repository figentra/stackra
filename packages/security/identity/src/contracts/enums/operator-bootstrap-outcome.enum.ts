/**
 * Stackra file contract:
 * Purpose: `OperatorBootstrapOutcome`, what `identity.operator.bootstrap@1` did: granted the role, found it already
 *          held, would grant it (a dry run), or found no user with the email.
 * Boundary: an `Enum.of` value plus the type of the same name, snake_case codes on the wire; `stackra ops
 *           bootstrap-operator` prints them and exits non-zero on `not_found`.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case codes); ADR 0294 (decision 16: `Enum.of`); STA-1586.
 */
import { Enum } from "@stackra/contracts";

/** The outcomes of an operator bootstrap. */
export const OperatorBootstrapOutcome = Enum.of({
  /** The role was written for the user at the platform node. */
  Granted: "granted",
  /** The user already held the role there; nothing was written. */
  AlreadyGranted: "already_granted",
  /** A dry run: the user exists and does not hold the role; nothing was written. */
  WouldGrant: "would_grant",
  /** No user, or no user with a Stackra id, has the email; nothing was written. */
  NotFound: "not_found",
});

/** One of the codes above. */
export type OperatorBootstrapOutcome = Enum.Value<typeof OperatorBootstrapOutcome>;
