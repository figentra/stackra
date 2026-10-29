/**
 * Stackra file contract:
 * Purpose: `backupAlerts(name, args, opts)`, the failure alerts of one backup vault: an SNS topic only AWS Backup of
 *          this account may publish to, and the vault's notifications of every failed backup, copy or restore job.
 * Boundary: internal; one topic per vault, in the vault's own account (AWS Backup does not notify across accounts).
 *           Who hears the topic (Slack, Better Stack, on-call email) is the observability stack's subscription; no
 *           address is held here.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 2, 4 and 5: a failed backup is seen the day it fails, not at the drill).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import { BACKUP_ALERT_EVENTS } from "#node/constants/backup-alert-events.constant";
import { policyOf } from "#node/functions/policy-of.function";

/**
 * The vault's alert topic.
 *
 * @param args.account - the vault's account, the only one whose AWS Backup may publish.
 * @param args.vaultName - the vault the notifications are put on.
 */
export function backupAlerts(
  name: string,
  args: { account: string; vaultName: pulumi.Input<string> },
  opts: pulumi.CustomResourceOptions,
): aws.sns.Topic {
  const topic = new aws.sns.Topic(`${name}-backup-alerts`, {}, opts);
  const policy = new aws.sns.TopicPolicy(
    `${name}-backup-alerts`,
    {
      arn: topic.arn,
      policy: policyOf([
        {
          Sid: "BackupPublish",
          Effect: "Allow",
          Principal: { Service: "backup.amazonaws.com" },
          Action: "SNS:Publish",
          Resource: topic.arn,
          Condition: { StringEquals: { "aws:SourceAccount": args.account } },
        },
      ]),
    },
    opts,
  );
  new aws.backup.VaultNotifications(
    `${name}-backup-alerts`,
    {
      backupVaultName: args.vaultName,
      snsTopicArn: topic.arn,
      backupVaultEvents: BACKUP_ALERT_EVENTS,
    },
    { ...opts, dependsOn: [policy] },
  );
  return topic;
}
