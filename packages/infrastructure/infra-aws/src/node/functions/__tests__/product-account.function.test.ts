/**
 * Stackra file contract:
 * Purpose: unit tests of `productAccount` under Pulumi's mocks: the account lands in its unit with billing access
 *          denied, the opt-in region is enabled, the budget alerts by email, and each sign-in role trusts only the
 *          account-access service and gets one entitlement for the principal.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172, ADR 0354, ADR 0524.
 */
import { describe, expect, it } from "@stackra/testing";

import { productAccount } from "#node/functions/product-account.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import type { ProductAccountArgs } from "#node/types/product-account-args.type";

const ARGS: ProductAccountArgs = {
  accountName: "acme-pay-me",
  email: "aws-pay-me@acme.example",
  parentId: "ou-me",
  optInRegion: "me-central-1",
  budget: {
    name: "acme-pay-me-monthly",
    monthlyUsd: "300",
    alerts: [
      { kind: "ACTUAL", percent: 80 },
      { kind: "FORECASTED", percent: 100 },
    ],
    emails: ["ops@acme.example"],
  },
  access: {
    applicationArn: "arn:aws:account-access:us-east-1:111111111111:application/app",
    principal: { userId: "user-1" },
    roles: [
      {
        name: "ReadOnly",
        path: "/acme/",
        policyArns: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
        inline: { NoSecretReads: { Version: "2012-10-17", Statement: [] } },
        maxSessionSeconds: 28_800,
      },
    ],
  },
};

describe("productAccount", () => {
  it("places the account in its unit and enables the opt-in region", async () => {
    const engine = await mockPulumi();
    productAccount("pay-me", ARGS, {});
    expect((await engine.find("Account", "pay-me")).inputs).toMatchObject({
      name: "acme-pay-me",
      email: "aws-pay-me@acme.example",
      parentId: "ou-me",
      iamUserAccessToBilling: "DENY",
      closeOnDeletion: false,
    });
    expect((await engine.find("aws:account/region:Region", "pay-me")).inputs).toMatchObject({
      accountId: "pay-me-id",
      regionName: "me-central-1",
      enabled: true,
    });
  });

  it("alerts on the budget by email", async () => {
    const engine = await mockPulumi();
    productAccount("pay-me", ARGS, {});
    const budget = await engine.find("Budget", "pay-me");
    expect(budget.inputs["limitAmount"]).toBe("300");
    expect(budget.inputs["notifications"]).toEqual([
      expect.objectContaining({
        notificationType: "ACTUAL",
        threshold: 80,
        subscriberEmailAddresses: ["ops@acme.example"],
      }),
      expect.objectContaining({ notificationType: "FORECASTED", threshold: 100 }),
    ]);
  });

  it("makes each sign-in role trust only the account-access service, with one entitlement", async () => {
    const engine = await mockPulumi();
    productAccount("pay-me", ARGS, {});
    const role = await engine.find("Role", "pay-me-readonly");
    expect(role.inputs).toMatchObject({
      name: "ReadOnly",
      path: "/acme/",
      maxSessionDuration: 28_800,
    });
    expect(JSON.parse(role.inputs["assumeRolePolicy"] as string).Statement).toEqual([
      {
        Effect: "Allow",
        Principal: { Service: "account-access.amazonaws.com" },
        Action: ["sts:AssumeRole", "sts:SetContext"],
      },
    ]);
    expect((await engine.find("RolePolicy", "pay-me-readonly-NoSecretReads")).inputs["name"]).toBe(
      "NoSecretReads",
    );
    expect((await engine.find("Entitlement", "pay-me-readonly")).inputs).toMatchObject({
      applicationArn: ARGS.access.applicationArn,
      entitlement: { principalRole: { principal: { identityCenter: { userId: "user-1" } } } },
    });
  });

  it("adds a read-only reader and reaches the account through it in a preview", async () => {
    const engine = await mockPulumi();
    productAccount(
      "pay-me",
      {
        ...ARGS,
        reader: {
          name: "InfraPreview",
          path: "/acme/",
          trustedArns: ["arn:aws:iam::111111111111:role/preview"],
        },
        readOnly: true,
      },
      {},
    );
    const reader = await engine.find("Role", "pay-me-reader");
    expect(JSON.parse(reader.inputs["assumeRolePolicy"] as string).Statement[0].Principal).toEqual({
      AWS: ["arn:aws:iam::111111111111:role/preview"],
    });
    expect((await engine.find("RolePolicyAttachment", "pay-me-reader")).inputs["policyArn"]).toBe(
      "arn:aws:iam::aws:policy/ReadOnlyAccess",
    );
    const provider = await engine.find("pulumi:providers:aws", "pay-me");
    expect(JSON.stringify(provider.inputs["assumeRoles"])).toContain("role/acme/InfraPreview");
  });

  it("refuses a read-only preview without a reader", async () => {
    await mockPulumi();
    expect(() => productAccount("pay-me", { ...ARGS, readOnly: true }, {})).toThrow(TypeError);
  });
});
