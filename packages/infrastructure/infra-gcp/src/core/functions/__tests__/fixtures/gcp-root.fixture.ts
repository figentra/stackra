/**
 * Stackra file contract:
 * Purpose: test fixture: `gcpRoot(change?)`, a root runway with staging and production on GCP (production in-country in
 *          KSA through its `ksa` region), a dedicated tenant in its own project, budgets with a non-production spend
 *          stop, a Cloud SQL database with backups, and the files disk on `s3`; `change` edits the draft before it is
 *          parsed. `at(value, ...path)` reaches into a draft.
 * Boundary: test only; built through `parseRunway`, so each root is valid. Every value is test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354, ADR 0400, ADR 0401.
 */
import { parseRunway } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";

/** The object at `path` inside `value`, for a test to change in place. */
export function at(value: unknown, ...path: string[]): Record<string, unknown> {
  return path.reduce<Record<string, unknown>>(
    (node, key) => node[key] as Record<string, unknown>,
    value as Record<string, unknown>,
  );
}

/** The root runway, changed by `change`. */
export function gcpRoot(change: (root: Record<string, unknown>) => void = () => {}): RootRunway {
  const root: Record<string, unknown> = {
    version: 3,
    project: "acme",
    providers: {
      gcp: {
        region: "europe-west3",
        projects: {
          nonprod: { id: "ref:gcp.projects.nonprod.id", number: "ref:gcp.projects.nonprod.number" },
          prod: { id: "acme-prod", number: "123456789012" },
          firm: { id: "acme-firm", number: "223456789012" },
        },
        requiredLabels: ["env", "tenant"],
        billingAccount: "ref:gcp.billingAccount",
        budgets: {
          currency: "EUR",
          thresholds: [50, 80, 100],
          stopNonProdAt: 100,
          monthly: { nonprod: "ref:gcp.budgets.nonprod", prod: 2000, firm: 500 },
        },
      },
      github: { org: "acme", repo: "acme-platform" },
    },
    regions: { ksa: { cloud: "gcp", location: "me-central2", jurisdiction: "sa" } },
    environments: {
      dev: { destinations: { services: "compose" } },
      staging: {
        cloud: { name: "gcp", account: "nonprod" },
        shared: {
          buckets: { versioning: true, lifecycle: { expireNoncurrentDays: 30 } },
          database: { tier: "db-custom-1-3840", version: "POSTGRES_17" },
        },
        defaults: { service: { config: { filesystem: { disk: "s3" } } } },
      },
      production: {
        cloud: { name: "gcp", account: "prod" },
        regions: ["ksa"],
        shared: {
          database: {
            tier: "db-custom-2-7680",
            version: "POSTGRES_17",
            highAvailability: true,
            backups: { retentionDays: 35, pitr: true, pitrDays: 7 },
          },
          network: { vpc: "ref:gcp.network.prod" },
        },
        defaults: { service: { config: { media: { disk: "s3" } } } },
        dedicated: { firm: { tenant: "tenant-1", cloud: { name: "gcp", account: "firm" } } },
      },
    },
  };
  change(root);
  return parseRunway("root", root);
}
