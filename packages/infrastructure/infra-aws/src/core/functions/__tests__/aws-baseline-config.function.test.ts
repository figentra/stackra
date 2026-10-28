/**
 * Stackra file contract:
 * Purpose: unit tests of `awsBaselineConfig`: the template-shaped root gives staging and production their accounts,
 *          tags, budgets (stopping only outside production), backups, files bucket, repository and Encore link;
 *          account ownership and sharing follow promotion order; static egress addresses and the jurisdiction come
 *          from the runway; backups that would leave an environment region's jurisdiction are refused; every missing
 *          input is reported with its path; an upload origin that is not https fails; a runway `media.disk` is
 *          ignored (ADR 0465).
 * Boundary: test only; roots are built through `parseRunway`, so each is a valid root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171, 0172, 0186, 0289, 0353, 0402.
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { awsBaselineConfig } from "#core/functions/aws-baseline-config.function";

/** The object at `path` inside `value`, for a test to change in place. */
function at(value: unknown, ...path: string[]): Record<string, unknown> {
  return path.reduce<Record<string, unknown>>(
    (node, key) => node[key] as Record<string, unknown>,
    value as Record<string, unknown>,
  );
}

/** The template's root runway, reduced to what infra-aws reads, plus a backup account and budget amounts. */
function templateRoot(change: (root: Record<string, unknown>) => void = () => {}): RootRunway {
  const root: Record<string, unknown> = {
    version: 3,
    project: "acme-platform",
    providers: {
      aws: {
        region: "me-central-1",
        accounts: {
          shared: "ref:aws.accounts.shared",
          nonprod: "ref:aws.accounts.nonprod",
          prod: "ref:aws.accounts.prod",
          backup: "ref:aws.accounts.backup",
        },
        budgets: {
          thresholds: [50, 80, 100],
          stopNonProdAt: 100,
          monthlyUsd: { nonprod: "ref:aws.budgets.nonprod", prod: 2000 },
        },
        requiredTags: ["env", "service", "tenant"],
      },
      encore: {
        app: "acme-platform",
        awsAccountId: "ref:encore.awsAccountId",
        externalId: "ref:encore.externalId",
      },
      github: { org: "acme", repo: "acme-platform" },
    },
    environments: {
      dev: { destinations: { services: "compose" }, topology: { mode: "monolith" } },
      staging: {
        destinations: { services: "encore-cloud" },
        encore: { env: "staging", account: "nonprod" },
        shared: { buckets: { versioning: true, lifecycle: { expireNoncurrentDays: 30 } } },
        defaults: { service: { config: { filesystem: { disk: "s3" }, media: { disk: "s3" } } } },
      },
      production: {
        destinations: { services: "encore-cloud" },
        encore: { env: "production", account: "prod" },
        shared: {
          database: { engine: "rds-postgres", backups: { retentionDays: 35, pitr: true } },
          buckets: { versioning: true },
        },
        defaults: { service: { config: { filesystem: { disk: "s3" }, media: { disk: "s3" } } } },
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

describe("awsBaselineConfig", () => {
  it("derives staging from the template's root", () => {
    const config = awsBaselineConfig(templateRoot(), "staging", [
      "https://console.staging.acme.example",
    ]);

    expect(config).toEqual({
      project: "acme-platform",
      environment: "staging",
      region: "me-central-1",
      account: "ref:aws.accounts.nonprod",
      ownsAccount: true,
      sharesAccount: false,
      backupAccount: "ref:aws.accounts.backup",
      tags: { env: "staging", service: "infra-aws", tenant: "shared", project: "acme-platform" },
      budgets: { monthlyUsd: "ref:aws.budgets.nonprod", thresholds: [50, 80, 100], stopAt: 100 },
      database: null,
      files: {
        versioning: true,
        expireNoncurrentDays: 30,
        origins: ["https://console.staging.acme.example"],
      },
      egress: null,
      jurisdiction: null,
      github: { org: "acme", repo: "acme-platform" },
      encore: { accountId: "ref:encore.awsAccountId", externalId: "ref:encore.externalId" },
    });
  });

  it("holds the static egress addresses and names the jurisdiction from the runway regions", () => {
    const root = templateRoot((draft) => {
      draft["regions"] = { uae: { cloud: "aws", location: "me-central-1", jurisdiction: "ae" } };
      at(draft, "environments", "production").regions = ["uae"];
      at(draft, "environments", "production", "shared").network = { egress: { staticIps: 2 } };
    });

    const config = awsBaselineConfig(root, "production");

    expect(config.egress).toEqual({ staticIps: 2 });
    expect(config.jurisdiction).toBe("ae");
  });

  it("refuses backups that would leave an environment region's jurisdiction", () => {
    const root = templateRoot((draft) => {
      draft["regions"] = {
        uae: { cloud: "aws", location: "me-central-1", jurisdiction: "ae" },
        eu: { cloud: "aws", location: "eu-central-1", jurisdiction: "eu" },
        ksa: { cloud: "gcp", location: "me-central2", jurisdiction: "sa" },
      };
      at(draft, "environments", "production").regions = ["uae", "ksa", "eu"];
    });

    expect(() => awsBaselineConfig(root, "production")).toThrow(
      /"eu" \(eu-central-1, eu\) would back up to me-central-1, ae/,
    );
    expect(pathsOf(() => awsBaselineConfig(root, "production"))).toEqual([
      "environments.production.regions",
    ]);
  });

  it("gives production fourteen days of point-in-time recovery and never stops its spend", () => {
    const config = awsBaselineConfig(templateRoot(), "production");

    expect(config.database).toEqual({ pitrDays: 14, snapshotDays: 35 });
    expect(config.budgets).toEqual({ monthlyUsd: "2000", thresholds: [50, 80, 100], stopAt: null });
    expect(config.files).toEqual({ versioning: true, expireNoncurrentDays: null, origins: [] });
  });

  it("lets the first environment of a shared account own it and stops no spend where production runs", () => {
    const root = templateRoot((draft) => {
      at(draft, "environments", "staging", "encore").account = "prod";
    });

    const staging = awsBaselineConfig(root, "staging");
    const production = awsBaselineConfig(root, "production");

    expect([staging.ownsAccount, staging.sharesAccount]).toEqual([true, true]);
    expect([production.ownsAccount, production.sharesAccount]).toEqual([false, true]);
    expect(staging.budgets?.stopAt).toBeNull();
  });

  it("leaves out what the runway does not ask for", () => {
    const root = templateRoot((draft) => {
      delete at(draft, "providers", "aws").budgets;
      delete at(draft, "providers").github;
      at(draft, "environments", "staging", "destinations").services = "aws-ecs";
      at(draft, "environments", "staging", "defaults", "service").config = {
        filesystem: { disk: "local" },
      };
    });

    const config = awsBaselineConfig(root, "staging");

    expect([config.budgets, config.files, config.github, config.encore]).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it("ignores a runway media.disk: only filesystem.disk asks for the files bucket (ADR 0465)", () => {
    const root = templateRoot((draft) => {
      at(draft, "environments", "staging", "defaults", "service").config = {
        filesystem: { disk: "local" },
        media: { disk: "s3" },
      };
    });

    expect(awsBaselineConfig(root, "staging").files).toBeNull();
  });

  it("reports every missing input with its path", () => {
    const root = templateRoot((draft) => {
      delete at(draft, "providers", "aws", "accounts").backup;
      delete at(draft, "providers", "aws", "budgets", "monthlyUsd").prod;
      delete at(draft, "providers", "encore").externalId;
    });

    expect(pathsOf(() => awsBaselineConfig(root, "production"))).toEqual([
      "providers.aws.budgets.monthlyUsd.prod",
      "providers.aws.accounts.backup",
      "providers.encore",
    ]);
  });

  it("refuses an environment with no account and an unquoted account id", () => {
    expect(pathsOf(() => awsBaselineConfig(templateRoot(), "dev"))).toEqual([
      "environments.dev.encore.account",
    ]);
    const unquoted = templateRoot((draft) => {
      at(draft, "providers", "aws", "accounts").prod = 12_345_678_901;
    });
    expect(pathsOf(() => awsBaselineConfig(unquoted, "production"))).toEqual([
      "providers.aws.accounts.prod",
    ]);
  });

  it("refuses an upload origin that is not https", () => {
    expect(() => awsBaselineConfig(templateRoot(), "staging", ["http://localhost:3000"])).toThrow(
      TypeError,
    );
  });
});
