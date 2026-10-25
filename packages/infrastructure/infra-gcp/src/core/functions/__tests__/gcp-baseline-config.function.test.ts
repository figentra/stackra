/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpBaselineConfig`: a root runway gives staging and production their projects, labels,
 *          budget, files bucket and repository; project ownership follows promotion order; every missing budget input
 *          is reported with its path; an environment in no project, a project the runway does not list and an upload
 *          origin that is not https fail.
 * Boundary: test only; roots are built through `parseRunway`, so each is a valid root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354, ADR 0171, ADR 0172, ADR 0222.
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { gcpBaselineConfig } from "#core/functions/gcp-baseline-config.function";

/** The object at `path` inside `value`, for a test to change in place. */
function at(value: unknown, ...path: string[]): Record<string, unknown> {
  return path.reduce<Record<string, unknown>>(
    (node, key) => node[key] as Record<string, unknown>,
    value as Record<string, unknown>,
  );
}

/** A root runway with staging and production on GCP, reduced to what infra-gcp reads. */
function gcpRoot(change: (root: Record<string, unknown>) => void = () => {}): RootRunway {
  const root: Record<string, unknown> = {
    version: 3,
    project: "acme",
    providers: {
      gcp: {
        region: "europe-west3",
        projects: {
          nonprod: { id: "ref:gcp.projects.nonprod.id", number: "ref:gcp.projects.nonprod.number" },
          prod: { id: "acme-prod", number: "123456789012" },
        },
        environments: { staging: "nonprod", production: "prod" },
        requiredLabels: ["env", "tenant"],
        billingAccount: "ref:gcp.billingAccount",
        budgets: {
          currency: "EUR",
          thresholds: [50, 80, 100],
          monthly: { nonprod: "ref:gcp.budgets.nonprod", prod: 2000 },
        },
      },
      github: { org: "acme", repo: "acme-platform" },
    },
    environments: {
      dev: { destinations: { services: "compose" } },
      staging: {
        shared: { buckets: { versioning: true, lifecycle: { expireNoncurrentDays: 30 } } },
        defaults: { service: { config: { filesystem: { disk: "s3" } } } },
      },
      production: {
        defaults: { service: { config: { media: { disk: "s3" } } } },
      },
    },
  };
  change(root);
  return parseRunway("root", root);
}

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
  it("derives staging from the root", () => {
    const config = gcpBaselineConfig(gcpRoot(), "staging", [
      "https://console.staging.acme.example",
    ]);

    expect(config).toEqual({
      project: "acme",
      environment: "staging",
      region: "europe-west3",
      cloudProject: {
        id: "ref:gcp.projects.nonprod.id",
        number: "ref:gcp.projects.nonprod.number",
      },
      ownsProject: true,
      labels: { env: "staging", tenant: "shared", project: "acme", service: "infra-gcp" },
      budgets: {
        billingAccount: "ref:gcp.billingAccount",
        currency: "EUR",
        amount: "ref:gcp.budgets.nonprod",
        thresholds: [50, 80, 100],
      },
      files: {
        versioning: true,
        expireNoncurrentDays: 30,
        origins: ["https://console.staging.acme.example"],
      },
      github: { org: "acme", repo: "acme-platform" },
    });
  });

  it("gives production its own project, budget and a versioned bucket by default", () => {
    const config = gcpBaselineConfig(gcpRoot(), "production");

    expect(config.cloudProject).toEqual({ id: "acme-prod", number: "123456789012" });
    expect(config.budgets?.amount).toBe("2000");
    expect(config.files).toEqual({ versioning: true, expireNoncurrentDays: null, origins: [] });
  });

  it("lets the first environment of a shared project own it", () => {
    const root = gcpRoot((draft) => {
      at(draft, "providers", "gcp", "environments").staging = "prod";
    });

    expect(gcpBaselineConfig(root, "staging").ownsProject).toBe(true);
    expect(gcpBaselineConfig(root, "production").ownsProject).toBe(false);
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

  it("refuses an environment in no project and a project the runway does not list", () => {
    expect(pathsOf(() => gcpBaselineConfig(gcpRoot(), "dev"))).toEqual([
      "providers.gcp.environments.dev",
    ]);
    const unlisted = gcpRoot((draft) => {
      at(draft, "providers", "gcp", "environments").staging = "qa";
    });
    expect(() => gcpBaselineConfig(unlisted, "staging")).toThrow(
      /providers\.gcp\.projects has no "qa"/,
    );
  });

  it("refuses an upload origin that is not https", () => {
    expect(() => gcpBaselineConfig(gcpRoot(), "staging", ["http://localhost:3000"])).toThrow(
      TypeError,
    );
  });
});
