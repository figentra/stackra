/**
 * Stackra file contract:
 * Purpose: `NotAMemberError`, the refusal when a principal that is not enrolled tries to redeem.
 * Boundary: a refusal (`forbidden`: the principal is authenticated but has no account); code `not_a_member`, derived
 *           from the class name. The text is `loyalty_kit::errors.not_a_member.message`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0140; ADR 0232; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable until the principal enrolls.
 *
 * @example
 * if (!(await members.isMember(member))) throw NotAMemberError.create({ principalId: member });
 */
export class NotAMemberError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The principal's public id, never a name or an email. */
  principalId!: string;
}
