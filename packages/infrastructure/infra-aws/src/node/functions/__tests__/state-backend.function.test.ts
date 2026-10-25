/**
 * Stackra file contract:
 * Purpose: unit tests of `stateBackend` under Pulumi's mocks: a rotating key and a versioned private bucket in the
 *          shared account; the bucket policy refuses plain HTTP and any other server-side encryption, and lets each
 *          environment account's infra role (only) read and write; a runway without a shared account is refused.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4 and enforcement), ADR 0289 (decision 9).
 */
import { describe, expect, it } from "@stackra/testing";

import type { AwsAccounts } from "#core/types/aws-accounts.type";
import { stateBackend } from "#node/functions/state-backend.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** Two environments in two accounts, plus the shared tooling account. */
const ACCOUNTS: AwsAccounts = {
  project: "acme",
  region: "me-central-1",
  shared: "ref:aws.accounts.shared",
  backup: null,
  requiredTags: ["env"],
  environments: [
    { environment: "staging", name: "nonprod", account: "111111111111" },
    { environment: "production", name: "prod", account: "222222222222" },
  ],
};

describe("stateBackend", () => {
  it("keeps the state in a versioned bucket on its own key in the shared account", async () => {
    const engine = await mockPulumi({ aws: { accounts: { shared: "333333333333" } } });
    const state = stateBackend(ACCOUNTS);

    expect((await engine.find("BucketVersioning", "acme-state")).inputs).toMatchObject({
      versioningConfiguration: { status: "Enabled" },
    });
    expect(
      (await engine.find("BucketServerSideEncryptionConfiguration", "acme-state")).inputs,
    ).toMatchObject({
      rules: [
        { applyServerSideEncryptionByDefault: { sseAlgorithm: "aws:kms" }, bucketKeyEnabled: true },
      ],
    });
    expect((await engine.find("Key", "acme-state")).inputs["enableKeyRotation"]).toBe(true);
    expect(await outputOf(state.bucket)).toBe("acme-state");
  });

  it("refuses other encryption and lets in only the environments' infra roles", async () => {
    const engine = await mockPulumi({ aws: { accounts: { shared: "333333333333" } } });
    stateBackend(ACCOUNTS);

    const policy = await engine.find("BucketPolicy", "acme-state");
    const statements = (
      JSON.parse(policy.inputs["policy"] as string) as {
        Statement: Record<string, unknown>[];
      }
    ).Statement;
    expect(statements.map((statement) => statement["Sid"])).toEqual([
      "DenyPlainHttp",
      "DenyOtherEncryption",
      "List0",
      "ReadWrite0",
      "List1",
      "ReadWrite1",
    ]);
    expect(statements[1]?.["Condition"]).toEqual({
      StringNotEquals: { "s3:x-amz-server-side-encryption": "aws:kms" },
      Null: { "s3:x-amz-server-side-encryption": "false" },
    });
    expect(statements[3]).toMatchObject({
      Principal: { AWS: "arn:aws:iam::111111111111:root" },
      Condition: {
        ArnLike: { "aws:PrincipalArn": ["arn:aws:iam::111111111111:role/acme-staging-infra"] },
      },
    });
  });

  it("refuses a runway without a shared account", () => {
    expect(() => stateBackend({ ...ACCOUNTS, shared: null })).toThrow(/shared tooling account/);
  });
});
