/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpBaseline` under Pulumi's mocks: the provider is pinned to the environment's resolved
 *          project and region with the cost labels; the data key, the files bucket on it, the infra service account
 *          and the budget are created and exported; an environment that does not own its project creates no budget;
 *          what the runway leaves out is not created; a malformed project id fails.
 * Boundary: test only; no engine and no cloud call (ADR 0171: agents never apply a stack).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354, ADR 0171, ADR 0172, ADR 0222.
 */
import { describe, expect, it } from "@stackra/testing";

import type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";
import { gcpBaseline } from "#node/functions/gcp-baseline.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** The stack config the `ref:` values read. */
const STACK = {
  gcp: { projects: { nonprod: { id: "acme-nonprod", number: "42" } } },
  billing: { account: "012345-6789AB-CDEF01", nonprod: 500 },
};

/** A staging environment that owns its project and asks for everything. */
const STAGING: GcpBaselineConfig = {
  project: "acme",
  environment: "staging",
  region: "europe-west3",
  cloudProject: { id: "ref:gcp.projects.nonprod.id", number: "ref:gcp.projects.nonprod.number" },
  ownsProject: true,
  labels: { project: "acme", env: "staging", service: "infra-gcp" },
  budgets: {
    billingAccount: "ref:billing.account",
    currency: "EUR",
    amount: "ref:billing.nonprod",
    thresholds: [50, 100],
  },
  files: { versioning: true, expireNoncurrentDays: 30, origins: [] },
  github: { org: "acme", repo: "acme-platform" },
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

describe("gcpBaseline", () => {
  it("pins the provider to the environment's project, region and cost labels", async () => {
    const engine = await mockPulumi(STACK);
    gcpBaseline(STAGING);

    const provider = await engine.find("pulumi:providers:gcp", "acme-staging");
    expect(provider.inputs).toMatchObject({ project: "acme-nonprod", region: "europe-west3" });
    expect(decoded(provider.inputs["defaultLabels"])).toEqual(STAGING.labels);
  });

  it("creates and exports the key, the bucket on it, the deploy identity and the budget", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = gcpBaseline(STAGING);

    expect(await outputOf(foundation.dataKeyId)).toBe("acme-staging-id");
    expect((await engine.find("Bucket", "acme-staging-files")).inputs).toMatchObject({
      project: "acme-nonprod",
      encryption: { defaultKmsKeyName: "acme-staging-id" },
    });
    expect(await outputOf(present(foundation.filesBucket))).toBe("acme-staging-files");
    expect((await engine.find("Account", "acme-staging-infra")).inputs["accountId"]).toBe(
      "acme-staging-infra",
    );
    expect(await outputOf(present(foundation.infraServiceAccount))).toBe(
      "acme-staging-infra@mock.iam.gserviceaccount.com",
    );
    expect(await outputOf(present(foundation.workloadIdentityProvider))).toBe(
      "acme-staging-github",
    );
    expect((await engine.find("Budget", "acme-staging")).inputs).toMatchObject({
      billingAccount: "012345-6789AB-CDEF01",
      budgetFilter: { projects: ["projects/42"] },
      amount: { specifiedAmount: { currencyCode: "EUR", units: "500" } },
    });
    expect(await outputOf(present(foundation.budgetTopic))).toBe("acme-staging-budgets-id");
  });

  it("leaves the budget to the project's owner and skips what the runway leaves out", async () => {
    const engine = await mockPulumi(STACK);
    const foundation = gcpBaseline({
      ...STAGING,
      environment: "production",
      ownsProject: false,
      files: null,
      github: null,
    });

    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("Budget");
    expect(types).not.toContain("Bucket");
    expect(types).not.toContain("WorkloadIdentityPool");
    expect([
      foundation.filesBucket,
      foundation.infraServiceAccount,
      foundation.workloadIdentityProvider,
      foundation.budgetTopic,
    ]).toEqual([null, null, null, null]);
  });

  it("refuses a project id GCP would not accept", async () => {
    await mockPulumi({ gcp: { projects: { nonprod: { id: "Acme", number: "42" } } } });

    expect(() => gcpBaseline(STAGING)).toThrow(/not a GCP project id/);
  });
});
