/**
 * Stackra file contract:
 * Purpose: `SettingApproverRoleError`, the refusal of an approval by someone without the role the revision's keys
 *          require (`setting_approver_role`): an owner-only switch approved by an admin who is not the owner.
 * Boundary: a refusal (`forbidden`); code derived from the class name. It names the revision and the role, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5); ADR 0359 (decisions 4 and 9); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable by the same approver.
 *
 * @example
 * throw SettingApproverRoleError.create({ revision: "rev_1", role: "owner" });
 */
export class SettingApproverRoleError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The revision. */
  revision!: string;

  /** The role its approver must hold. */
  role!: string;
}
