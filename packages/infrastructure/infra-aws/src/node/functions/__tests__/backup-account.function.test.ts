/**
 * Stackra file contract:
 * Purpose: unit tests of `backupAccount` under Pulumi's mocks: the vault and replica bucket carry the fixed names the
 *          environment stacks copy into; the vault takes copies from the environment accounts and denies early
 *          deletion to everyone; it is locked in governance mode unless compliance is asked for, and its failures are
 *          alerted on a topic only AWS Backup of the account publishes to; the replica bucket lets each environment's replication role write and keeps replaced
 *          versions 35 days; environments sharing an account become one user; missing accounts are refused.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0186 (decisions 2 and 3 as amended 2026-10-24).
 */
import { describe, expect, it } from "@stackra/testing";

import type { AwsAccounts } from "#core/types/aws-accounts.type";
import { backupAccount } from "#node/functions/backup-account.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";
import type { MockedResource } from "#testing/types/mocked-resource.type";

/** Staging and production in one account, plus the backup account. */
const ACCOUNTS: AwsAccounts = {
  project: "acme",
  region: "me-central-1",
  shared: null,
  backup: "999999999999",
  backupLock: { minRetentionDays: 35, maxRetentionDays: 35, changeableForDays: null },
  requiredTags: [],
  environments: [
    { environment: "staging", name: "product", account: "111111111111" },
    { environment: "production", name: "product", account: "111111111111" },
  ],
};

/** The statements of `resource`'s policy. */
function statementsOf(resource: MockedResource): Record<string, unknown>[] {
  return (
    JSON.parse(resource.inputs["policy"] as string) as { Statement: Record<string, unknown>[] }
  ).Statement;
}

describe("backupAccount", () => {
  it("creates the vault and the replica bucket under their fixed names", async () => {
    const engine = await mockPulumi();
    backupAccount(ACCOUNTS);

    expect((await engine.find("Vault", "acme-backup")).inputs["name"]).toBe("acme-backup");
    expect((await engine.find("Bucket", "acme-backup")).inputs["bucket"]).toBe(
      "acme-backup-999999999999",
    );
    expect((await engine.find("Alias", "acme-backup")).inputs["name"]).toBe("alias/acme-backup");
  });

  it("takes copies from the environment accounts and lets nobody delete early", async () => {
    const engine = await mockPulumi();
    backupAccount(ACCOUNTS);

    expect(statementsOf(await engine.find("VaultPolicy", "acme-backup"))).toEqual([
      {
        Sid: "EnvironmentsCopyIn",
        Effect: "Allow",
        Principal: { AWS: ["arn:aws:iam::111111111111:root"] },
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
    ]);
  });

  it("locks the vault in governance mode by default", async () => {
    const engine = await mockPulumi();
    backupAccount(ACCOUNTS);

    const lock = await engine.find("VaultLockConfiguration", "acme-backup");
    expect(lock.inputs).toMatchObject({
      backupVaultName: "acme-backup",
      minRetentionDays: 35,
      maxRetentionDays: 35,
    });
    expect(lock.inputs["changeableForDays"]).toBeUndefined();
  });

  it("locks the vault in compliance mode only when the runway asks for it", async () => {
    const engine = await mockPulumi();
    backupAccount({
      ...ACCOUNTS,
      backupLock: { minRetentionDays: 7, maxRetentionDays: 35, changeableForDays: 3 },
    });

    expect((await engine.find("VaultLockConfiguration", "acme-backup")).inputs).toMatchObject({
      minRetentionDays: 7,
      maxRetentionDays: 35,
      changeableForDays: 3,
    });
  });

  it("alerts the vault's failed jobs on a topic only the backup account's AWS Backup publishes to", async () => {
    const engine = await mockPulumi();
    const outputs = backupAccount(ACCOUNTS);

    expect(
      statementsOf(await engine.find("TopicPolicy", "acme-backup-backup-alerts"))[0]?.["Condition"],
    ).toEqual({ StringEquals: { "aws:SourceAccount": "999999999999" } });
    expect(
      (await engine.find("VaultNotifications", "acme-backup-backup-alerts")).inputs[
        "backupVaultName"
      ],
    ).toBe("acme-backup");
    expect(await outputOf(outputs.alertTopicArn)).toBe("arn:aws:mock:::acme-backup-backup-alerts");
  });

  it("lets each environment's replication role write the replica bucket", async () => {
    const engine = await mockPulumi();
    backupAccount(ACCOUNTS);

    const replicate = statementsOf(await engine.find("BucketPolicy", "acme-backup")).find(
      (statement) => statement["Sid"] === "Replicate0",
    );
    expect(replicate?.["Condition"]).toEqual({
      ArnLike: {
        "aws:PrincipalArn": [
          "arn:aws:iam::111111111111:role/acme-staging-replication",
          "arn:aws:iam::111111111111:role/acme-production-replication",
        ],
      },
    });
    expect(
      (await engine.find("BucketLifecycleConfiguration", "acme-backup")).inputs["rules"],
    ).toEqual([
      {
        id: "replaced-versions",
        status: "Enabled",
        filter: {},
        noncurrentVersionExpiration: { noncurrentDays: 35 },
      },
    ]);
  });

  it("refuses a runway without a backup account or any environment account", () => {
    expect(() => backupAccount({ ...ACCOUNTS, backup: null })).toThrow(/backup names no account/);
    expect(() => backupAccount({ ...ACCOUNTS, environments: [] })).toThrow(/No environment/);
  });
});
