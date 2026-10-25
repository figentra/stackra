/**
 * Stackra file contract:
 * Purpose: `databaseBackups(name, args, opts)`, the environment's Postgres backups through AWS Backup: a vault on the
 *          environment's data key, continuous backup for point-in-time recovery (when on), and a daily snapshot that
 *          lives one day in the environment's account and is copied to the backup account's vault for the snapshot
 *          days, so a snapshot outlives the account it was taken in.
 * Boundary: internal; selects every RDS instance and Aurora cluster of the account, or only those tagged with the
 *           environment when another environment shares the account. It does not create the database: Encore Cloud
 *           or the runtime stack does, and the database must be encrypted with the environment's data key for the
 *           cross-account copy to succeed. Cross-account backup must be switched on in the organisation's management
 *           account (an owner step). The restore drill is a runbook, not code.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 1, 2, 4 and 5 as amended 2026-10-24: per region, another account),
 *                     ADR 0238 (one database server per environment).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import { policyOf } from "#node/functions/policy-of.function";

/** Every RDS instance and Aurora cluster of the account. */
const DATABASES = ["arn:aws:rds:*:*:db:*", "arn:aws:rds:*:*:cluster:*"];

/** The AWS-managed policies of AWS Backup's service role. */
const SERVICE_POLICIES = {
  backup: "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
  restores: "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
};

/**
 * The environment's backup vault.
 *
 * @param args.copyTo - the backup account vault's ARN.
 * @param args.byTag - select only the databases tagged `env=<environment>`.
 */
export function databaseBackups(
  name: string,
  args: {
    environment: string;
    keyArn: pulumi.Output<string>;
    database: { pitrDays: number | null; snapshotDays: number };
    copyTo: string;
    byTag: boolean;
    roleName: string;
  },
  opts: pulumi.CustomResourceOptions,
): aws.backup.Vault {
  const vault = new aws.backup.Vault(name, { kmsKeyArn: args.keyArn }, opts);
  const role = new aws.iam.Role(
    `${name}-backup`,
    {
      name: args.roleName,
      assumeRolePolicy: policyOf([
        {
          Effect: "Allow",
          Principal: { Service: "backup.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ]),
    },
    opts,
  );
  for (const [purpose, policyArn] of Object.entries(SERVICE_POLICIES))
    new aws.iam.RolePolicyAttachment(
      `${name}-backup-${purpose}`,
      { role: role.name, policyArn },
      opts,
    );

  const { pitrDays, snapshotDays } = args.database;
  const plan = new aws.backup.Plan(
    name,
    {
      rules: [
        ...(pitrDays === null
          ? []
          : [
              {
                ruleName: "point-in-time",
                targetVaultName: vault.name,
                schedule: "cron(0 5 ? * * *)",
                enableContinuousBackup: true,
                lifecycle: { deleteAfter: pitrDays },
              },
            ]),
        {
          ruleName: "snapshot",
          targetVaultName: vault.name,
          schedule: "cron(0 3 ? * * *)",
          lifecycle: { deleteAfter: 1 },
          copyActions: [
            { destinationVaultArn: args.copyTo, lifecycle: { deleteAfter: snapshotDays } },
          ],
        },
      ],
    },
    opts,
  );
  new aws.backup.Selection(
    name,
    {
      name: `${args.environment}-postgres`,
      planId: plan.id,
      iamRoleArn: role.arn,
      resources: DATABASES,
      ...(args.byTag
        ? {
            conditions: [
              { stringEquals: [{ key: "aws:ResourceTag/env", value: args.environment }] },
            ],
          }
        : {}),
    },
    opts,
  );
  return vault;
}
