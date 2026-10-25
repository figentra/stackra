/**
 * Stackra file contract:
 * Purpose: unit tests of `ciAccess` under Pulumi's mocks: the environment's own Workload Identity pool and GitHub
 *          provider admit only one repository's environment, only that subject may impersonate the infra service
 *          account, and the service account owns the project.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0167 (CI over OIDC), ADR 0172 (decision 1), ADR 0354.
 */
import { describe, expect, it } from "@stackra/testing";

import { ciAccess } from "#node/functions/ci-access.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** The arguments. */
const ARGS = {
  project: "acme-stg",
  environment: "staging",
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

  it("lets only that subject impersonate the infra service account, which owns the project", async () => {
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
    expect((await engine.find("IAMMember", "acme-staging-infra-owner")).inputs).toEqual({
      project: "acme-stg",
      role: "roles/owner",
      member: "serviceAccount:acme-staging-infra@mock.iam.gserviceaccount.com",
    });
    expect(await outputOf(serviceAccount.email)).toBe(
      "acme-staging-infra@mock.iam.gserviceaccount.com",
    );
    expect(await outputOf(provider.name)).toBe("acme-staging-github");
  });
});
