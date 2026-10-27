/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpBaselineConfig`: the runway `cloud` gives staging and production their projects, labels,
 *          budget, files bucket and repository; production runs in its KSA region and never stops spend; a dedicated
 *          tenant gets its own project, prefix and tenant label; project ownership follows promotion order; the Encore
 *          Cloud service account is named only where services deploy to Encore Cloud, and must be a service account;
 *          every missing budget input is reported with its path; a deployment not on GCP, a project the runway does
 *          not list, a project name too long for a service account id and an upload origin that is not https fail;
 *          the static egress addresses come from `shared.network.egress`.
 * Boundary: test only; roots are built through `parseRunway`, so each is a valid root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354, ADR 0171, ADR 0172, ADR 0222, ADR 0400, ADR 0401,
 *                     ADR 0435, ADR 0402.
 */
import { RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { gcpBaselineConfig } from "#core/functions/gcp-baseline-config.function";
import { at, gcpRoot } from "#core/functions/__tests__/fixtures/gcp-root.fixture";

/** The paths a `RunwayInvalidError` names. */
function pathsOf(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("Expected a RunwayInvalidError");
}

describe("gcpBaselineConfig", () => {
  it("derives staging from its runway cloud", () => {
    const config = gcpBaselineConfig(gcpRoot(), "staging", [
      "https://console.staging.acme.example",
    ]);

    expect(config).toEqual({
      project: "acme",
      environment: "staging",
      deployment: "acme-staging",
      dedicated: null,
      projectKey: "nonprod",
      cloudProject: {
        id: "ref:gcp.projects.nonprod.id",
        number: "ref:gcp.projects.nonprod.number",
      },
      region: "europe-west3",
      ownsProject: true,
      labels: { env: "staging", tenant: "shared", project: "acme", service: "infra-gcp" },
      budgets: {
        billingAccount: "ref:gcp.billingAccount",
        currency: "EUR",
        amount: "ref:gcp.budgets.nonprod",
        thresholds: [50, 80, 100],
        stopAt: 100,
      },
      files: {
        versioning: true,
        expireNoncurrentDays: 30,
        origins: ["https://console.staging.acme.example"],
      },
      github: { org: "acme", repo: "acme-platform" },
      encore: null,
      egress: null,
    });
  });

  it("holds the static egress addresses the runway asks for", () => {
    const root = gcpRoot((draft) => {
      at(draft, "environments", "production", "shared").network = {
        vpc: "ref:gcp.network.prod",
        egress: { staticIps: 2 },
      };
    });

    expect(gcpBaselineConfig(root, "production").egress).toEqual({ staticIps: 2 });
    expect(gcpBaselineConfig(root, "staging").egress).toBeNull();
  });

  it("names the Encore Cloud service account only where services deploy to Encore Cloud", () => {
    const root = gcpRoot((draft) => {
      at(draft, "providers", "gcp").encore = {
        serviceAccount: "encore-acme@encore-cloud.iam.gserviceaccount.com",
      };
      at(draft, "environments", "staging").destinations = { services: "encore-cloud" };
    });

    expect(gcpBaselineConfig(root, "staging").encore).toEqual({
      serviceAccount: "encore-acme@encore-cloud.iam.gserviceaccount.com",
    });
    expect(gcpBaselineConfig(root, "production").encore).toBeNull();
  });

  it("refuses an Encore principal that is not a service account", () => {
    const root = gcpRoot((draft) => {
      at(draft, "providers", "gcp").encore = { serviceAccount: "someone@example.com" };
    });

    expect(pathsOf(() => gcpBaselineConfig(root, "staging"))).toEqual([
      "providers.gcp.encore.serviceAccount",
    ]);
  });

  it("runs production in its KSA region, in its own project, and never stops its spend", () => {
    const config = gcpBaselineConfig(gcpRoot(), "production");

    expect(config.region).toBe("me-central2");
    expect(config.cloudProject).toEqual({ id: "acme-prod", number: "123456789012" });
    expect(config.budgets?.amount).toBe("2000");
    expect(config.budgets?.stopAt).toBeNull();
    expect(config.files).toEqual({ versioning: true, expireNoncurrentDays: null, origins: [] });
  });

  it("gives a dedicated tenant its own project, prefix and tenant label", () => {
    const config = gcpBaselineConfig(gcpRoot(), "production", [], "firm");

    expect(config).toMatchObject({
      deployment: "acme-firm",
      dedicated: { key: "firm", scope: "tenant-1" },
      projectKey: "firm",
      cloudProject: { id: "acme-firm", number: "223456789012" },
      region: "me-central2",
      ownsProject: true,
      labels: { tenant: "tenant-1", env: "production" },
    });
    expect(config.budgets?.stopAt).toBeNull();
  });

  it("lets the first environment of a shared project own it", () => {
    const root = gcpRoot((draft) => {
      at(draft, "environments", "staging").cloud = { name: "gcp", account: "prod" };
    });

    expect(gcpBaselineConfig(root, "staging").ownsProject).toBe(true);
    expect(gcpBaselineConfig(root, "production").ownsProject).toBe(false);
    expect(gcpBaselineConfig(root, "staging").budgets?.stopAt).toBeNull();
  });

  it("leaves out what the runway does not ask for", () => {
    const root = gcpRoot((draft) => {
      delete at(draft, "providers", "gcp").budgets;
      delete at(draft, "providers").github;
      at(draft, "environments", "staging", "defaults", "service").config = {
        filesystem: { disk: "local" },
      };
    });

    const config = gcpBaselineConfig(root, "staging");

    expect([config.budgets, config.files, config.github]).toEqual([null, null, null]);
  });

  it("reports every missing budget input with its path", () => {
    const root = gcpRoot((draft) => {
      delete at(draft, "providers", "gcp").billingAccount;
      delete at(draft, "providers", "gcp", "budgets", "monthly").prod;
    });

    expect(pathsOf(() => gcpBaselineConfig(root, "production"))).toEqual([
      "providers.gcp.budgets.monthly.prod",
      "providers.gcp.billingAccount",
    ]);
  });

  it("refuses a deployment off GCP, an unlisted project and a name too long for a service account", () => {
    expect(pathsOf(() => gcpBaselineConfig(gcpRoot(), "dev"))).toEqual(["environments.dev.cloud"]);
    const unlisted = gcpRoot((draft) => {
      at(draft, "environments", "staging").cloud = { name: "gcp", account: "qa" };
    });
    expect(pathsOf(() => gcpBaselineConfig(unlisted, "staging"))).toEqual([
      "providers.gcp.projects.qa",
    ]);
    const long = gcpRoot((draft) => {
      draft["project"] = "acme-platform-xx";
    });
    expect(pathsOf(() => gcpBaselineConfig(long, "production"))).toEqual(["project", "project"]);
  });

  it("refuses an upload origin that is not https", () => {
    expect(() => gcpBaselineConfig(gcpRoot(), "staging", ["http://localhost:3000"])).toThrow(
      TypeError,
    );
  });
});
