/**
 * Stackra file contract:
 * Purpose: unit tests of `awsBaseline` under Pulumi's mocks: the provider is pinned to the environment's account with
 *          the cost tags; the data key rotates and lets the backup account use it; the files bucket gets the media CORS
 *          rule, the upload expiry and replication to the backup account; Postgres gets point-in-time recovery,
 *          snapshot copies and failure alerts; the infra role trusts only the environment's GitHub deploy job; the Encore Cloud role
 *          needs the external id; the budget alerts and stops non-production spend; an environment that shares an
 *          account creates no account-wide resource and selects its database by tag; the static egress addresses are
 *          held and exported only when asked for; a bad account id fails.
 * Boundary: test only; no engine and no cloud call (ADR 0171: agents never apply a stack).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171, 0172, 0186, 0222, 0289, 0402.
 */
import { describe, expect, it } from "@stackra/testing";

import type { AwsBaselineConfig } from "#core/types/aws-baseline-config.type";
import { awsBaseline } from "#node/functions/aws-baseline.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";
import type { MockedResource } from "#testing/types/mocked-resource.type";

/** The stack config the `ref:` values read. */
const STACK = {
  aws: {
    accounts: { nonprod: "111111111111", prod: "222222222222", backup: "999999999999" },
    budgets: { nonprod: "500" },
  },
  encore: { awsAccountId: "888888888888", externalId: "ext-123" },
};

/** A staging environment that owns its account and asks for everything. */
const STAGING: AwsBaselineConfig = {
  project: "acme",
  environment: "staging",
  region: "me-central-1",
  account: "ref:aws.accounts.nonprod",
  ownsAccount: true,
  sharesAccount: false,
  backupAccount: "ref:aws.accounts.backup",
  tags: { project: "acme", env: "staging", service: "infra-aws" },
  budgets: { monthlyUsd: "ref:aws.budgets.nonprod", thresholds: [50, 80, 100], stopAt: 100 },
  database: { pitrDays: 14, snapshotDays: 35 },
  files: {
    versioning: true,
    expireNoncurrentDays: 30,
    origins: ["https://console.staging.acme.example"],
  },
  egress: null,
  jurisdiction: "ae",
  github: { org: "acme", repo: "acme-platform" },
  encore: { accountId: "ref:encore.awsAccountId", externalId: "ref:encore.externalId" },
};

/** A value a provider may receive JSON-encoded. */
function decoded(value: unknown): unknown {
  return typeof value === "string" && /^[[{]/.test(value) ? JSON.parse(value) : value;
}

/** `value`, which the test expects to be there. */
function present<T>(value: T | null): T {
  if (value === null) throw new Error("Expected an output");
  return value;
}

/** The statements of the policy document in `field`. */
function statementsOf(resource: MockedResource, field = "policy"): Record<string, unknown>[] {
  return (JSON.parse(resource.inputs[field] as string) as { Statement: Record<string, unknown>[] })
    .Statement;
}

describe("awsBaseline", () => {
  it("pins the provider to the environment's account, region and cost tags", async () => {
    const engine = await mockPulumi(STACK);
    awsBaseline(STAGING);

    const provider = await engine.find("pulumi:providers:aws", "acme-staging");
    expect(provider.inputs["region"]).toBe("me-central-1");
    expect(decoded(provider.inputs["allowedAccountIds"])).toEqual(["111111111111"]);
    expect(decoded(provider.inputs["defaultTags"])).toEqual({ tags: STAGING.tags });
  });

  it("creates a rotating data key the backup account may use", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline(STAGING);

    const key = await engine.find("Key", "acme-staging");
    expect(key.inputs["enableKeyRotation"]).toBe(true);
    expect(statementsOf(key).map((statement) => statement["Sid"])).toEqual([
      "OwnerAccount",
      "Use0",
      "Grant0",
    ]);
    expect(statementsOf(key)[1]?.["Principal"]).toEqual({
      AWS: "arn:aws:iam::999999999999:root",
    });
    expect((await engine.find("Alias", "acme-staging")).inputs["name"]).toBe("alias/acme-staging");
    expect(await outputOf(foundation.dataKeyArn)).toBe("arn:aws:mock:::acme-staging");
  });

  it("gives the files bucket the media CORS rule, the upload expiry and replication", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline(STAGING);

    expect(
      (await engine.find("BucketCorsConfiguration", "acme-staging-files")).inputs,
    ).toMatchObject({
      corsRules: [
        {
          allowedMethods: ["PUT"],
          allowedOrigins: ["https://console.staging.acme.example"],
          allowedHeaders: ["content-type", "x-amz-meta-*"],
        },
      ],
    });
    expect(
      (await engine.find("BucketLifecycleConfiguration", "acme-staging-files")).inputs["rules"],
    ).toEqual([
      {
        id: "unclaimed-uploads",
        status: "Enabled",
        filter: { prefix: "uploads/" },
        expiration: { days: 1 },
      },
      {
        id: "replaced-versions",
        status: "Enabled",
        filter: {},
        noncurrentVersionExpiration: { noncurrentDays: 30 },
      },
    ]);
    const block = await engine.find("BucketPublicAccessBlock", "acme-staging-files");
    expect(block.inputs).toMatchObject({ blockPublicAcls: true, restrictPublicBuckets: true });
    expect(statementsOf(await engine.find("BucketPolicy", "acme-staging-files"))[0]).toMatchObject({
      Effect: "Deny",
      Condition: { Bool: { "aws:SecureTransport": "false" } },
    });

    const replication = await engine.find("BucketReplicationConfig", "acme-staging-files");
    expect(replication.inputs["rules"]).toMatchObject([
      {
        deleteMarkerReplication: { status: "Disabled" },
        destination: {
          bucket: "arn:aws:s3:::acme-backup-999999999999",
          account: "999999999999",
          encryptionConfiguration: {
            replicaKmsKeyId: "arn:aws:kms:me-central-1:999999999999:alias/acme-backup",
          },
        },
      },
    ]);
    const role = await engine.find("Role", "acme-staging-files-replication");
    expect(role.inputs["name"]).toBe("acme-staging-replication");
    expect(statementsOf(role, "assumeRolePolicy")[0]?.["Condition"]).toMatchObject({
      StringEquals: { "aws:SourceAccount": "111111111111" },
    });
    expect(await outputOf(present(foundation.filesBucket))).toBe("acme-staging-files");
  });

  it("backs Postgres up with point-in-time recovery and snapshot copies in the backup account", async () => {
    const engine = await mockPulumi(STACK);
    awsBaseline(STAGING);

    const plan = await engine.find("Plan", "acme-staging");
    expect(plan.inputs["rules"]).toMatchObject([
      { ruleName: "point-in-time", enableContinuousBackup: true, lifecycle: { deleteAfter: 14 } },
      {
        ruleName: "snapshot",
        lifecycle: { deleteAfter: 1 },
        copyActions: [
          {
            destinationVaultArn:
              "arn:aws:backup:me-central-1:999999999999:backup-vault:acme-backup",
            lifecycle: { deleteAfter: 35 },
          },
        ],
      },
    ]);
    const selection = await engine.find("Selection", "acme-staging");
    expect(selection.inputs["resources"]).toEqual([
      "arn:aws:rds:*:*:db:*",
      "arn:aws:rds:*:*:cluster:*",
    ]);
    expect(selection.inputs["conditions"]).toBeUndefined();
  });

  it("alerts the environment vault's failed jobs on a topic only its account's AWS Backup publishes to", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline(STAGING);

    expect(
      statementsOf(await engine.find("TopicPolicy", "acme-staging-backup-alerts"))[0]?.[
        "Condition"
      ],
    ).toEqual({ StringEquals: { "aws:SourceAccount": "111111111111" } });
    expect(
      (await engine.find("VaultNotifications", "acme-staging-backup-alerts")).inputs[
        "backupVaultEvents"
      ],
    ).toContain("COPY_JOB_FAILED");
    expect(await outputOf(present(foundation.backupAlertTopicArn))).toBe(
      "arn:aws:mock:::acme-staging-backup-alerts",
    );
  });

  it("lets only the environment's GitHub deploy job assume the infra role", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline(STAGING);

    const provider = await engine.find("OpenIdConnectProvider", "acme-staging");
    expect(provider.inputs).toMatchObject({
      url: "https://token.actions.githubusercontent.com",
      clientIdLists: ["sts.amazonaws.com"],
    });
    const role = await engine.find("Role", "acme-staging-infra");
    expect(statementsOf(role, "assumeRolePolicy")[0]?.["Condition"]).toEqual({
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:acme/acme-platform:environment:staging",
      },
    });
    expect(await outputOf(present(foundation.infraRoleArn))).toBe(
      "arn:aws:mock:::acme-staging-infra",
    );
  });

  it("lets Encore Cloud in only with the external id", async () => {
    const engine = await mockPulumi(STACK);
    awsBaseline(STAGING);

    const role = await engine.find("Role", "acme-staging-encore");
    expect(statementsOf(role, "assumeRolePolicy")[0]).toMatchObject({
      Principal: { AWS: "arn:aws:iam::888888888888:root" },
      Condition: { StringEquals: { "sts:ExternalId": "ext-123" } },
    });
    expect(
      (await engine.find("RolePolicyAttachment", "acme-staging-encore-admin")).inputs,
    ).toMatchObject({ policyArn: "arn:aws:iam::aws:policy/AdministratorAccess" });
  });

  it("alerts at each threshold and stops new spend in a non-production account", async () => {
    const engine = await mockPulumi(STACK);
    awsBaseline(STAGING);

    const budget = await engine.find("Budget", "acme-staging");
    expect(budget.inputs).toMatchObject({
      budgetType: "COST",
      limitAmount: "500",
      timeUnit: "MONTHLY",
    });
    expect(
      (budget.inputs["notifications"] as { threshold: number }[]).map((entry) => entry.threshold),
    ).toEqual([50, 80, 100]);
    const action = await engine.find("BudgetAction", "acme-staging");
    expect(action.inputs).toMatchObject({
      actionType: "APPLY_IAM_POLICY",
      actionThreshold: { actionThresholdType: "PERCENTAGE", actionThresholdValue: 100 },
      definition: { iamActionDefinition: { roles: ["acme-staging-infra", "acme-staging-encore"] } },
    });
    const topic = await engine.find("TopicPolicy", "acme-staging-budgets");
    expect(statementsOf(topic)[0]?.["Condition"]).toEqual({
      StringEquals: { "aws:SourceAccount": "111111111111" },
      ArnLike: { "aws:SourceArn": "arn:aws:budgets::111111111111:*" },
    });
  });

  it("leaves account-wide resources to the account's owner and selects the database by tag", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline({
      ...STAGING,
      environment: "production",
      account: "ref:aws.accounts.prod",
      ownsAccount: false,
      sharesAccount: true,
    });

    const resources = await engine.settled();
    const types = resources.map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("OpenIdConnectProvider");
    expect(types).not.toContain("Budget");
    expect([foundation.encoreRoleArn, foundation.budgetTopicArn]).toEqual([null, null]);
    const role = await engine.find("Role", "acme-production-infra");
    expect(statementsOf(role, "assumeRolePolicy")[0]?.["Principal"]).toEqual({
      Federated: "arn:aws:iam::222222222222:oidc-provider/token.actions.githubusercontent.com",
    });
    expect((await engine.find("Selection", "acme-production")).inputs["conditions"]).toEqual([
      { stringEquals: [{ key: "aws:ResourceTag/env", value: "production" }] },
    ]);
  });

  it("skips replication and backups without a backup account", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline({ ...STAGING, backupAccount: null, database: null });

    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("BucketReplicationConfig");
    expect(types).not.toContain("Plan");
    expect([foundation.backupVaultArn, foundation.backupAlertTopicArn]).toEqual([null, null]);
    expect(statementsOf(await engine.find("Key", "acme-staging"))).toHaveLength(1);
  });

  it("refuses an account that does not resolve to twelve digits", async () => {
    await mockPulumi({ ...STACK, aws: { ...STACK.aws, accounts: { nonprod: 12_345 } } });

    expect(() => awsBaseline(STAGING)).toThrow(/not a 12-digit AWS account id/);
  });

  it("holds the static egress addresses and exports them for partner allow-lists", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline({ ...STAGING, egress: { staticIps: 2 } });

    for (const index of [1, 2])
      expect((await engine.find("Eip", `acme-staging-egress-${index}`)).inputs).toMatchObject({
        domain: "vpc",
        tags: { Name: `acme-staging-egress-${index}`, purpose: "egress" },
      });
    expect(await outputOf(present(foundation.egressAllocationIds))).toHaveLength(2);
    expect(foundation.egressIps).not.toBeNull();
  });

  it("holds no egress address when the runway asks for none", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = awsBaseline(STAGING);
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("Eip");
    expect([foundation.egressIps, foundation.egressAllocationIds]).toEqual([null, null]);
  });
});
