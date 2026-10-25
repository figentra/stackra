/**
 * Stackra file contract:
 * Purpose: unit tests of `dataKey` under Pulumi's mocks: a rotating key with a 30-day deletion window and its
 *          alias; the owner account's full access; and for each cross-account user a use statement and a grant
 *          statement limited to AWS resources.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (the foundation), ADR 0172 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { dataKey } from "#node/functions/data-key.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** The statements of the key policy. */
async function statementsOf(
  users: Parameters<typeof dataKey>[1]["users"],
): Promise<{ inputs: Record<string, unknown>; statements: Record<string, unknown>[] }> {
  const engine = await mockPulumi();
  dataKey("acme", { account: "111111111111", alias: "acme-data", description: "data", users }, {});
  const key = await engine.find("Key", "acme");
  const policy = JSON.parse(key.inputs["policy"] as string) as {
    Statement: Record<string, unknown>[];
  };
  const alias = (await engine.find("Alias", "acme")).inputs;
  return { inputs: { ...key.inputs, alias }, statements: policy.Statement };
}

describe("dataKey", () => {
  it("rotates, waits 30 days to delete and takes an alias", async () => {
    const { inputs } = await statementsOf([]);

    expect(inputs).toMatchObject({
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      description: "data",
      alias: { name: "alias/acme-data" },
    });
  });

  it("gives the owner account full access and nobody else when there are no users", async () => {
    const { statements } = await statementsOf([]);

    expect(statements).toEqual([
      {
        Sid: "OwnerAccount",
        Effect: "Allow",
        Principal: { AWS: "arn:aws:iam::111111111111:root" },
        Action: "kms:*",
        Resource: "*",
      },
    ]);
  });

  it("adds a use and a grant statement per cross-account user", async () => {
    const roles = ["arn:aws:iam::222222222222:role/acme-staging-infra"];
    const { statements } = await statementsOf([{ account: "222222222222", roles }]);

    expect(statements.map((statement) => statement["Sid"])).toEqual([
      "OwnerAccount",
      "Use0",
      "Grant0",
    ]);
    expect(statements[1]).toMatchObject({
      Principal: { AWS: "arn:aws:iam::222222222222:root" },
      Condition: { ArnLike: { "aws:PrincipalArn": roles } },
    });
    expect(statements[1]?.["Action"]).toContain("kms:Decrypt");
    expect(statements[2]).toMatchObject({
      Action: ["kms:CreateGrant", "kms:ListGrants", "kms:RevokeGrant"],
      Condition: { Bool: { "kms:GrantIsForAWSResource": "true" } },
    });
  });
});
