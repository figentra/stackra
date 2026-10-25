/**
 * Stackra file contract:
 * Purpose: `SignInCancelledError`, the refusal a sign-in rejects with when the user closed the hosted sign-in or
 *          declined it at the provider (`sign_in_cancelled`).
 * Boundary: kind `Unauthenticated`, retryable: pressing the button again may succeed. It carries no details. The page
 *           shows it inline and stays where it is; it is an answer, so nobody reports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0140 (envelope and kinds); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The user stopped the sign-in.
 *
 * @example
 * if (callback === null) throw SignInCancelledError.create();
 */
export class SignInCancelledError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: true,
}) {}
