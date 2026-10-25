/**
 * Stackra file contract:
 * Purpose: `awsBaseline(config, opts?)`, the Pulumi program of one environment's free AWS foundation: an AWS provider
 *          pinned to the environment's account and region with the cost tags as default tags, then the data key, the
 *          files bucket (with replication to the backup account), the Postgres backups, the GitHub OIDC infra role,
 *          and, from the account's first environment, the Encore Cloud role and the budget with its stop action.
 * Boundary: creates resources only through Pulumi; agents run it under `stackra infra preview` or Pulumi's mocks and
 *           never apply it (`pulumi up` is the owner's or the deploy job's). The VPC, the database server, caches and
 *           queues are Encore Cloud's or the runtime stack's, not this program's. The provider refuses any account but
 *           the environment's, so stale credentials cannot touch another account.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 1 to 5), ADR 0172 (decisions 1, 2 and 5), ADR 0186, ADR 0289 (decision 5),
 *                     ADR 0222.
 */
import * as pulumi from "@pulumi/pulumi";

import type { AwsBaselineConfig } from "#core/types/aws-baseline-config.type";
import { accountId } from "#node/functions/account-id.function";
import { accountProvider } from "#node/functions/account-provider.function";
import { backupTargets } from "#node/functions/backup-targets.function";
import { ciAccess } from "#node/functions/ci-access.function";
import { costControls } from "#node/functions/cost-controls.function";
import { dataKey } from "#node/functions/data-key.function";
import { databaseBackups } from "#node/functions/database-backups.function";
import { encoreAccess } from "#node/functions/encore-access.function";
import { filesBucket } from "#node/functions/files-bucket.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import { roleName } from "#node/functions/role-name.function";
import type { AwsBaselineOutputs } from "#node/types/aws-baseline-outputs.type";

/**
 * The environment's foundation.
 *
 * @param config - from `awsBaselineConfig(root, environment, origins)`, or the `<env>.infra.config.json` gen writes.
 * @throws TypeError when an account resolves to anything but 12 digits; Pulumi's config error when a `ref:` is unset.
 * @example
 * // .stackra/infra/index.ts (generated)
 * const config = awsBaselineConfig(readRunway("runway.yaml", "root"), "staging", origins);
 * export const foundation = awsBaseline(config);
 */
export function awsBaseline(
  config: AwsBaselineConfig,
  opts?: pulumi.ComponentResourceOptions,
): AwsBaselineOutputs {
  const { project, environment, region } = config;
  const account = accountId(config.account, `the ${environment} account`);
  const backup =
    config.backupAccount === null
      ? null
      : accountId(config.backupAccount, "providers.aws.accounts.backup");
  const targets = backup === null ? null : backupTargets(project, region, backup);
  const prefix = `${project}-${environment}`;

  const group = new pulumi.ComponentResource("stackra:infra-aws:Baseline", prefix, {}, opts);
  const provider = accountProvider(
    prefix,
    { account, region, tags: config.tags },
    { parent: group },
  );
  const options = { parent: group, provider };

  const key = dataKey(
    prefix,
    {
      account,
      alias: prefix,
      description: `${prefix}: the environment's data (database, files, backups)`,
      users: backup === null ? [] : [{ account: backup }],
    },
    options,
  );

  const files =
    config.files === null
      ? null
      : filesBucket(
          `${prefix}-files`,
          {
            account,
            region,
            keyArn: key.arn,
            files: config.files,
            replica: backup === null || targets === null ? null : { account: backup, targets },
            replicationRole: roleName(project, environment, "replication"),
          },
          options,
        );

  const vault =
    config.database === null || targets === null
      ? null
      : databaseBackups(
          prefix,
          {
            environment,
            keyArn: key.arn,
            database: config.database,
            copyTo: targets.vaultArn,
            byTag: config.sharesAccount,
            roleName: roleName(project, environment, "backup"),
          },
          options,
        );

  const infra =
    config.github === null
      ? null
      : ciAccess(
          prefix,
          {
            account,
            environment,
            github: config.github,
            roleName: roleName(project, environment, "infra"),
            createProvider: config.ownsAccount,
          },
          options,
        );

  const encore =
    config.encore === null || !config.ownsAccount
      ? null
      : encoreAccess(
          prefix,
          {
            encore: {
              accountId: accountId(config.encore.accountId, "providers.encore.awsAccountId"),
              externalId: resolveRef(config.encore.externalId),
            },
            roleName: roleName(project, environment, "encore"),
          },
          options,
        );

  const topic =
    config.budgets === null || !config.ownsAccount
      ? null
      : costControls(
          prefix,
          {
            account,
            budgets: { ...config.budgets, monthlyUsd: resolveRef(config.budgets.monthlyUsd) },
            stoppable: [infra, encore].flatMap((role) => (role === null ? [] : [role.name])),
            actionRoleName: roleName(project, environment, "budget-action"),
          },
          options,
        );

  return {
    dataKeyArn: key.arn,
    filesBucket: files?.bucket ?? null,
    backupVaultArn: vault?.arn ?? null,
    infraRoleArn: infra?.arn ?? null,
    encoreRoleArn: encore?.arn ?? null,
    budgetTopicArn: topic?.arn ?? null,
  };
}
