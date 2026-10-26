/**
 * Stackra file contract:
 * Purpose: unit tests of `ciAccess` under Pulumi's mocks: the environment's own Workload Identity pool and GitHub
 *          provider admit only one repository's environment, only that subject may impersonate the infra service
 *          account, and the service account holds the deploy roles and never `roles/owner`.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0167 (CI over OIDC), ADR 0172 (decision 1), ADR 0354.
 */
import { describe, expect, it } from "@stackra/testing";

import { DEPLOY_ROLES } from "#node/constants/deploy-roles.constant";
import { ciAccess } from "#node/functions/ci-access.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** The arguments. */
const ARGS = {
  project: "acme-stg",
  environment: "staging",
  pool: "staging",
  github: { org: "figentra", repo: "stackra" },
  accountId: "acme-staging-infra",
};

describe("ciAccess", () => {
  it("admits only the repository's environment through the environment's own pool", async () => {
    const engine = await mockPulumi();
    ciAccess("acme-staging", ARGS, {});

    expect((await engine.find("WorkloadIdentityPool", "acme-staging-github")).inputs).toMatchObject(
      {
        project: "acme-stg",
        workloadIdentityPoolId: "staging-github",
      },
    );
    expect(
      (await engine.find("WorkloadIdentityPoolProvider", "acme-staging-github")).inputs,
    ).toMatchObject({
      workloadIdentityPoolId: "staging-github",
      workloadIdentityPoolProviderId: "github",
      attributeMapping: { "google.subject": "assertion.sub" },
      attributeCondition: 'assertion.sub == "repo:figentra/stackra:environment:staging"',
      oidc: { issuerUri: "https://token.actions.githubusercontent.com" },
    });
  });

  it("lets only that subject impersonate the infra service account, which holds the deploy roles", async () => {
    const engine = await mockPulumi();
    const { serviceAccount, provider } = ciAccess("acme-staging", ARGS, {});

    expect((await engine.find("Account", "acme-staging-infra")).inputs).toMatchObject({
      project: "acme-stg",
      accountId: "acme-staging-infra",
    });
    expect((await engine.find("IAMMember", "acme-staging-infra-github")).inputs).toEqual({
      serviceAccountId: "acme-staging-infra",
      role: "roles/iam.workloadIdentityUser",
      member:
        "principal://iam.googleapis.com/acme-staging-github/subject/repo:figentra/stackra:environment:staging",
    });
    expect((await engine.find("IAMMember", "acme-staging-infra-cloudsql-admin")).inputs).toEqual({
      project: "acme-stg",
      role: "roles/cloudsql.admin",
      member: "serviceAccount:acme-staging-infra@mock.iam.gserviceaccount.com",
    });
    const roles = (await engine.settled())
      .filter(
        (resource) =>
          resource.type.endsWith("IAMMember") && resource.inputs["project"] !== undefined,
      )
      .map((resource) => resource.inputs["role"]);
    expect(roles).toEqual([...DEPLOY_ROLES]);
    expect(roles).not.toContain("roles/owner");
    expect(await outputOf(serviceAccount.email)).toBe(
      "acme-staging-infra@mock.iam.gserviceaccount.com",
    );
    expect(await outputOf(provider.name)).toBe("acme-staging-github");
  });
});
