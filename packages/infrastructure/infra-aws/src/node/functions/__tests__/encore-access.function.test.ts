/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreAccess` under Pulumi's mocks: the role Encore Cloud's account assumes only with the
 *          external id, under its fixed name, with the administrator policy attached.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (the foundation), ADR 0172 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { encoreAccess } from "#node/functions/encore-access.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

describe("encoreAccess", () => {
  it("lets Encore's account assume the role only with the external id", async () => {
    const engine = await mockPulumi();
    encoreAccess(
      "acme",
      {
        encore: { accountId: "555555555555", externalId: "ext-1" },
        roleName: "acme-staging-encore",
      },
      {},
    );

    const role = await engine.find("Role", "acme-encore");
    expect(role.inputs["name"]).toBe("acme-staging-encore");
    expect(JSON.parse(role.inputs["assumeRolePolicy"] as string).Statement).toEqual([
      {
        Effect: "Allow",
        Principal: { AWS: "arn:aws:iam::555555555555:root" },
        Action: "sts:AssumeRole",
        Condition: { StringEquals: { "sts:ExternalId": "ext-1" } },
      },
    ]);
  });

  it("attaches the administrator policy to the role", async () => {
    const engine = await mockPulumi();
    encoreAccess(
      "acme",
      {
        encore: { accountId: "555555555555", externalId: "ext-1" },
        roleName: "acme-staging-encore",
      },
      {},
    );

    expect((await engine.find("RolePolicyAttachment", "acme-encore-admin")).inputs).toMatchObject({
      role: "acme-staging-encore",
      policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
    });
  });
});
