/**
 * Stackra file contract:
 * Purpose: `AccountFrozenError`, the refusal when an account is frozen for review and a caller tries to move its
 *          points.
 * Boundary: a refusal (`conflict`: the request is well formed, the account's state forbids it); code
 *           `account_frozen`, derived from the class name; the field is the envelope's detail. The text is
 *           `loyalty_kit::errors.account_frozen.message`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0232; ADR 0328 (`create`).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable for the client: it clears only once staff unfreeze the account.
 *
 * @example
 * if (!account.canTransact) throw AccountFrozenError.create({ accountId: account.id });
 */
export class AccountFrozenError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The frozen account. */
  accountId!: PublicId<"lac">;
}
