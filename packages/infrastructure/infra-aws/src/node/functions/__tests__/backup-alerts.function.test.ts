/**
 * Stackra file contract:
 * Purpose: unit tests of `backupAlerts` under Pulumi's mocks: a topic only this account's AWS Backup may publish to,
 *          and the vault's notifications of failed backup, copy and restore jobs (never a success) on it.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0186 (decisions 2, 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { backupAlerts } from "#node/functions/backup-alerts.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

describe("backupAlerts", () => {
  it("lets only this account's AWS Backup publish to the topic", async () => {
    const engine = await mockPulumi();
    backupAlerts("acme", { account: "111111111111", vaultName: "acme-vault" }, {});

    const policy = await engine.find("TopicPolicy", "acme-backup-alerts");
    expect(
      (JSON.parse(policy.inputs["policy"] as string) as { Statement: unknown[] }).Statement,
    ).toEqual([
      {
        Sid: "BackupPublish",
        Effect: "Allow",
        Principal: { Service: "backup.amazonaws.com" },
        Action: "SNS:Publish",
        Resource: "arn:aws:mock:::acme-backup-alerts",
        Condition: { StringEquals: { "aws:SourceAccount": "111111111111" } },
      },
    ]);
  });

  it("puts the failure events of the vault on the topic and no success", async () => {
    const engine = await mockPulumi();
    const topic = backupAlerts("acme", { account: "111111111111", vaultName: "acme-vault" }, {});

    const notifications = await engine.find("VaultNotifications", "acme-backup-alerts");
    expect(notifications.inputs).toMatchObject({
      backupVaultName: "acme-vault",
      snsTopicArn: await outputOf(topic.arn),
    });
    expect(notifications.inputs["backupVaultEvents"]).toEqual([
      "BACKUP_JOB_FAILED",
      "BACKUP_JOB_EXPIRED",
      "CONTINUOUS_BACKUP_INTERRUPTED",
      "COPY_JOB_FAILED",
      "RESTORE_JOB_FAILED",
    ]);
  });
});
