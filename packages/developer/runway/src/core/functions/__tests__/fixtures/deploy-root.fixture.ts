/**
 * Stackra file contract:
 * Purpose: test fixture: a root runway with staging on AWS (UAE) and production in-country in KSA on GCP, deployed by
 *          promotion, with one dedicated tenant in its own GCP project; services on Encore Cloud and mobile on EAS.
 * Boundary: test only; built through `parseRunway`, so it is a valid root runway. Every value is test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 4), ADR 0400.
 */
import { parseRunway } from "#core/functions/parse-runway.function";
import type { RootRunway } from "#core/types/root-runway.type";

/** The root runway. */
export const DEPLOY_ROOT: RootRunway = parseRunway("root", {
  version: 3,
  project: "acme",
  providers: {
    aws: { accounts: { nonprod: "ref:aws.accounts.nonprod" } },
    gcp: { projects: { ksa: "ref:gcp.projects.ksa", firm: "ref:gcp.projects.firm" } },
    encore: { app: "acme" },
  },
  regions: {
    uae: { cloud: "aws", location: "me-central-1", jurisdiction: "ae" },
    ksa: {
      cloud: "gcp",
      location: "me-central2",
      account: "ref:gcp.projects.ksa",
      jurisdiction: "sa",
    },
  },
  environments: {
    staging: {
      destinations: { services: "encore-cloud", mobile: "eas" },
      cloud: { name: "aws", account: "nonprod" },
      regions: ["uae"],
      encore: { branch: "staging" },
      mobile: { channel: "preview" },
    },
    production: {
      destinations: { services: "encore-cloud", mobile: "eas" },
      cloud: { name: "gcp", account: "ksa" },
      regions: ["ksa"],
      encore: { branch: "main", regions: { ksa: { branch: "ksa" } } },
      mobile: { channel: "production" },
      deploy: { on: "promote", approval: "github-environment" },
      dedicated: {
        firm: {
          tenant: "tenant-1",
          cloud: { name: "gcp", account: "firm" },
          encore: { branch: "firm" },
        },
      },
    },
  },
  targets: { "encore-cloud": {}, eas: { release: "build" } },
});
