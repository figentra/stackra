/**
 * Stackra file contract:
 * Purpose: unit tests of `ciAccess` under Pulumi's mocks: the infra role GitHub Actions assumes over OIDC only for
 *          one repository's environment (audience and subject pinned, one-hour sessions), the account's OIDC provider
 *          created only for its first environment, and the administrator policy attached.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0167 (CI over OIDC), ADR 0172 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { ciAccess } from "#node/functions/ci-access.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** The arguments; `createProvider` varies. */
function argsWith(createProvider: boolean) {
  return {
    account: "111111111111",
    environment: "staging",
    github: { org: "figentra", repo: "stackra" },
    roleName: "acme-staging-infra",
    createProvider,
  };
}

/** The first statement of the role's trust policy. */
async function trustOf(engine: Awaited<ReturnType<typeof mockPulumi>>) {
  const role = await engine.find("Role", "acme-infra");
  return {
    role,
    statement: (JSON.parse(role.inputs["assumeRolePolicy"] as string) as { Statement: unknown[] })
      .Statement[0],
  };
}

describe("ciAccess", () => {
  it("trusts the account's existing provider for this repository's environment only", async () => {
    const engine = await mockPulumi();
    ciAccess("acme", argsWith(false), {});

    const { role, statement } = await trustOf(engine);
    expect(role.inputs).toMatchObject({ name: "acme-staging-infra", maxSessionDuration: 3600 });
    expect(statement).toMatchObject({
      Principal: {
        Federated: "arn:aws:iam::111111111111:oidc-provider/token.actions.githubusercontent.com",
      },
      Action: "sts:AssumeRoleWithWebIdentity",
      Condition: {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:figentra/stackra:environment:staging",
        },
      },
    });
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("OpenIdConnectProvider");
  });

  it("creates the OIDC provider for the account's first environment", async () => {
    const engine = await mockPulumi();
    ciAccess("acme", argsWith(true), {});

    expect((await engine.find("OpenIdConnectProvider", "acme")).inputs).toMatchObject({
      url: "https://token.actions.githubusercontent.com",
      clientIdLists: ["sts.amazonaws.com"],
    });
    expect((await trustOf(engine)).statement).toMatchObject({
      Principal: { Federated: "arn:aws:mock:::acme" },
    });
  });

  it("attaches the administrator policy", async () => {
    const engine = await mockPulumi();
    ciAccess("acme", argsWith(false), {});

    expect((await engine.find("RolePolicyAttachment", "acme-infra-admin")).inputs).toMatchObject({
      policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
    });
  });
});
