/**
 * Stackra file contract:
 * Purpose: `accountsFrom(runway)`, the accounts of a narrowed root runway: the shared and backup accounts, the backup
 *          vault's lock and, in promotion order, each environment's account from its `encore.account` key.
 * Boundary: internal; shared by `awsAccounts` and `awsBaselineConfig`, which parse the root once each.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 1), ADR 0289 (decision 5: the Encore environment names its account),
 *                     ADR 0186 (the backup account).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment, RunwayInvalidError } from "@stackra/runway";
import type { RunwayIssue } from "@stackra/runway";

import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { backupLockFrom } from "#core/functions/backup-lock-from.function";
import type { AwsAccounts } from "#core/types/aws-accounts.type";
import type { EnvironmentAccount } from "#core/types/environment-account.type";
import type { InfraRunway } from "#core/types/infra-runway.type";

/**
 * The accounts of `runway`.
 *
 * @throws RunwayInvalidError when an environment names an account `providers.aws.accounts` does not list, or the
 *         backup vault lock would refuse an environment's copies (`backupLockFrom`).
 */
export function accountsFrom(runway: InfraRunway): AwsAccounts {
  const { accounts, region, requiredTags } = runway.providers.aws;
  const issues: RunwayIssue[] = [];
  const environments: EnvironmentAccount[] = [];
  for (const environment of Enum.values(RunwayEnvironment)) {
    const name = runway.environments[environment]?.encore?.account;
    if (name === undefined) continue;
    const account = accounts[name];
    if (account === undefined)
      issues.push({
        path: `environments.${environment}.encore.account`,
        message: `providers.aws.accounts has no "${name}"`,
      });
    else environments.push({ environment, name, account });
  }
  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);
  return {
    project: runway.project,
    region,
    shared: accounts.shared ?? null,
    backup: accounts.backup ?? null,
    backupLock: backupLockFrom(runway),
    requiredTags,
    environments,
  };
}
