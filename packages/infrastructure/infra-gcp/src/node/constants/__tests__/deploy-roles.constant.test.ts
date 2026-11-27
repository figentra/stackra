/**
 * Stackra file contract:
 * Purpose: unit tests of `DEPLOY_ROLES` under Pulumi's mocks: every kind of resource `gcpRuntime` declares for a
 *          server's planned Postgres extensions (the admin user, its Secret Manager copy and the reader's grant, the
 *          job's service account and the Cloud Run job, on a private IP and through the connector) has the role that
 *          creates it among the deploy identity's roles, so the first apply that names an extension is not refused.
 * Boundary: test only; no engine and no cloud call (ADR 0171). The table maps a provider module to the predefined
 *           roles that manage it; a module missing from the table fails, so a new resource kind names its role here
 *           and in `DEPLOY_ROLES` in the same change.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 1), ADR 0401; ADR 0160 (note of 2026-11-26).
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";
import { DEPLOY_ROLES } from "#node/constants/deploy-roles.constant";
import { gcpRuntime } from "#node/functions/gcp-runtime.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/**
 * The predefined roles the deploy identity needs per provider module (`gcp:<module>/...`). A Cloud Run job runs as a
 * service account the deployment makes, so creating it also needs acting as that account.
 */
const ROLES_BY_MODULE: Readonly<Record<string, readonly string[]>> = {
  sql: ["roles/cloudsql.admin"],
  secretmanager: ["roles/secretmanager.admin"],
  serviceaccount: ["roles/iam.serviceAccountAdmin"],
  projects: ["roles/resourcemanager.projectIamAdmin"],
  cloudrunv2: ["roles/run.admin", "roles/iam.serviceAccountUser"],
};

/** Production whose services name extensions, with pgaudit, the slow log and the cache left out of this check. */
function withExtensions(network: string | null): GcpRuntimeConfig {
  return {
    project: "acme",
    environment: "production",
    deployment: "acme-production",
    dedicated: null,
    projectKey: "prod",
    cloudProject: { id: "acme-prod", number: "123456789012" },
    region: "me-central2",
    ownsProject: true,
    labels: { project: "acme", env: "production", service: "infra-gcp" },
    database: {
      tier: "db-custom-2-7680",
      version: "POSTGRES_18",
      highAvailability: false,
      retainedBackups: 7,
      pitr: false,
      pgaudit: false,
      slowQueryMs: false,
      network,
      extensions: ["pg_trgm", "vector"],
    },
    cache: null,
  };
}

/** The provider modules of every GCP resource the program registered. */
async function modulesOf(engine: Awaited<ReturnType<typeof mockPulumi>>): Promise<string[]> {
  const types = (await engine.settled())
    .map((resource) => resource.type)
    .filter((type) => type.startsWith("gcp:"));
  return [...new Set(types.map((type) => type.split(":")[1]?.split("/")[0] ?? type))].toSorted();
}

describe("DEPLOY_ROLES", () => {
  it.each([
    ["a private IP over direct VPC egress", "ref:gcp.network.prod"],
    ["the Cloud SQL connector", null],
  ])(
    "holds a role for every resource kind the extensions declare, on %s",
    async (_path, network) => {
      const engine = await mockPulumi({
        gcp: { network: { prod: "projects/acme-prod/global/networks/main" } },
      });
      gcpRuntime(withExtensions(network), { adminPassword: pulumi.secret("p") });

      const modules = await modulesOf(engine);
      expect(modules).toContain("secretmanager");
      expect(modules).toContain("cloudrunv2");
      for (const module of modules) {
        const roles = ROLES_BY_MODULE[module];
        expect(
          roles,
          `no role is known for gcp:${module}; add it here and to DEPLOY_ROLES`,
        ).toBeDefined();
        for (const role of roles ?? [])
          expect(DEPLOY_ROLES, `gcp:${module} needs ${role}`).toContain(role);
      }
    },
  );

  it("never grants the project's owner or editor role", () => {
    expect(DEPLOY_ROLES).not.toContain("roles/owner");
    expect(DEPLOY_ROLES).not.toContain("roles/editor");
  });
});
