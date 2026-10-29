/**
 * Stackra file contract:
 * Purpose: `backupAccount(accounts, opts?)`, the Pulumi program of the backup account: a KMS key, the vault every
 *          environment copies its daily Postgres snapshot into (copies allowed from the environment accounts, early
 *          deletion and lifecycle changes denied to everyone, a vault lock on the retention, failures alerted on a
 *          topic), and the versioned replica bucket the files buckets replicate into, all in the one region, so a
 *          backup outlives the account it was taken in.
 * Boundary: run by the owner in its own stack with the backup account's credentials. Names are fixed
 *           (`backupTargets`), so environment stacks copy into them without reading this stack. The environment
 *           replication roles are trusted by their fixed ARNs through a condition. Never another region: the data
 *           stays in the region it was created in. The lock is governance mode unless the runway asks for compliance,
 *           which becomes irreversible after its cooling-off days; who hears the alert topic is the observability
 *           stack's subscription.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 2 and 3 as amended 2026-10-24, consequence: a backup outlives its
 *                     production account), ADR 0188 (decision 3: the lock's ceiling), ADR 0172.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { SNAPSHOT_DAYS } from "#core/constants/snapshot-days.constant";
import { costTags } from "#core/functions/cost-tags.function";
import type { AwsAccounts } from "#core/types/aws-accounts.type";
import { accountId } from "#node/functions/account-id.function";
import { accountProvider } from "#node/functions/account-provider.function";
import { backupAlerts } from "#node/functions/backup-alerts.function";
import { backupTargets } from "#node/functions/backup-targets.function";
import { crossAccount } from "#node/functions/cross-account.function";
import { dataKey } from "#node/functions/data-key.function";
import { environmentUsers } from "#node/functions/environment-users.function";
import { policyOf } from "#node/functions/policy-of.function";
import { privateBucket } from "#node/functions/private-bucket.function";
import type { BackupAccountOutputs } from "#node/types/backup-account-outputs.type";

/**
 * The backup account's vault, replica bucket and key.
 *
 * @param accounts - from `awsAccounts(root)`.
 * @throws TypeError when the runway names no backup account or no environment account, or an account is not 12
 *         digits.
 * @example
 * export const backups = backupAccount(awsAccounts(readRunway("runway.yaml", "root")));
 */
export function backupAccount(
  accounts: AwsAccounts,
  opts?: pulumi.ComponentResourceOptions,
): BackupAccountOutputs {
  if (accounts.backup === null)
    throw new TypeError("providers.aws.accounts.backup names no account");
  if (accounts.environments.length === 0)
    throw new TypeError("No environment names an AWS account (environments.<env>.encore.account)");
  const { project, region } = accounts;
  const account = accountId(accounts.backup, "providers.aws.accounts.backup");
  const targets = backupTargets(project, region, account);
  const users = environmentUsers(accounts, "replication");
  const name = targets.vaultName;

  const group = new pulumi.ComponentResource("stackra:infra-aws:BackupAccount", name, {}, opts);
  const provider = accountProvider(
    name,
    { account, region, tags: costTags(project, "backup", accounts.requiredTags) },
    { parent: group },
  );
  const options = { parent: group, provider };

  const key = dataKey(
    name,
    { account, alias: name, description: `${project}: backup copies and replicas`, users },
    options,
  );
  const vault = new aws.backup.Vault(
    name,
    { name: targets.vaultName, kmsKeyArn: key.arn },
    options,
  );
  new aws.backup.VaultPolicy(
    name,
    {
      backupVaultName: vault.name,
      policy: policyOf([
        {
          Sid: "EnvironmentsCopyIn",
          Effect: "Allow",
          Principal: { AWS: users.map((user) => `arn:aws:iam::${user.account}:root`) },
          Action: "backup:CopyIntoBackupVault",
          Resource: "*",
        },
        {
          Sid: "NobodyDeletesEarly",
          Effect: "Deny",
          Principal: "*",
          Action: ["backup:DeleteRecoveryPoint", "backup:UpdateRecoveryPointLifecycle"],
          Resource: "*",
        },
      ]),
    },
    options,
  );
  const { minRetentionDays, maxRetentionDays, changeableForDays } = accounts.backupLock;
  new aws.backup.VaultLockConfiguration(
    name,
    {
      backupVaultName: vault.name,
      minRetentionDays,
      maxRetentionDays,
      ...(changeableForDays === null ? {} : { changeableForDays }),
    },
    options,
  );
  const alerts = backupAlerts(name, { account, vaultName: vault.name }, options);
  const { bucket } = privateBucket(
    name,
    {
      bucket: targets.bucketName,
      keyArn: key.arn,
      versioning: true,
      lifecycle: [
        {
          id: "replaced-versions",
          status: "Enabled",
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: SNAPSHOT_DAYS },
        },
      ],
      statements: (arn) =>
        users.flatMap((user, index) => [
          {
            Sid: `Versioning${index}`,
            Effect: "Allow",
            Principal: { AWS: `arn:aws:iam::${user.account}:root` },
            Action: ["s3:GetBucketVersioning", "s3:ListBucket"],
            Resource: arn,
          },
          {
            Sid: `Replicate${index}`,
            Effect: "Allow",
            Action: [
              "s3:ReplicateObject",
              "s3:ReplicateTags",
              "s3:ObjectOwnerOverrideToBucketOwner",
            ],
            Resource: pulumi.interpolate`${arn}/*`,
            ...crossAccount(user),
          },
        ]),
    },
    options,
  );
  return {
    vaultArn: vault.arn,
    replicaBucket: bucket.bucket,
    kmsKeyArn: key.arn,
    alertTopicArn: alerts.arn,
  };
}
