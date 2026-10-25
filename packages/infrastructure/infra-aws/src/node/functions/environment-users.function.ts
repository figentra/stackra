/**
 * Stackra file contract:
 * Purpose: `environmentUsers(accounts, purpose)`, each environment account as a cross-account user of an account-wide
 *          key or bucket, narrowed to the fixed-name role of `purpose` of every environment that runs there (the infra
 *          roles for the state, the replication roles for the backup account).
 * Boundary: internal; resolves each account id; environments that share an account become one user with both roles.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1), ADR 0171 (decision 4), ADR 0186 (decision 3).
 */
import type { AwsAccounts } from "#core/types/aws-accounts.type";
import { accountId } from "#node/functions/account-id.function";
import { roleName } from "#node/functions/role-name.function";
import type { KeyUser } from "#node/types/key-user.type";

/** The users, one per account, in promotion order of their first environment. */
export function environmentUsers(
  accounts: AwsAccounts,
  purpose: "infra" | "replication",
): KeyUser[] {
  const roles = new Map<string, string[]>();
  for (const { environment, name, account } of accounts.environments) {
    const id = accountId(account, `providers.aws.accounts.${name}`);
    const arn = `arn:aws:iam::${id}:role/${roleName(accounts.project, environment, purpose)}`;
    roles.set(id, [...(roles.get(id) ?? []), arn]);
  }
  return [...roles].map(([account, arns]) => ({ account, roles: arns }));
}
