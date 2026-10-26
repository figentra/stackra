/**
 * Stackra file contract:
 * Purpose: unit tests of `deployTargets`: kinds in build order, regions in release order and the dedicated tenant's
 *          services after the shared ones with its own cloud and Encore block; an environment without regions gives
 *          one target per kind; an unknown environment and an undeclared dedicated region throw.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 4), ADR 0400, OS-12.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";

describe("deployTargets", () => {
  it("lands production in KSA on GCP, the dedicated tenant after the shared services", () => {
    const targets = deployTargets(DEPLOY_ROOT, "production");

    expect(targets.map((target) => target.id)).toEqual([
      "production/services/ksa",
      "production/services/ksa/dedicated:firm",
      "production/mobile/ksa",
    ]);
    expect(targets[0]).toMatchObject({
      kind: "services",
      destination: "encore-cloud",
      region: { key: "ksa", cloud: "gcp", location: "me-central2", jurisdiction: "sa" },
      cloud: { name: "gcp", account: "ksa" },
    });
    expect(targets[1]).toMatchObject({
      dedicated: { key: "firm", tenant: "tenant-1" },
      cloud: { name: "gcp", account: "firm" },
      scope: { encore: { branch: "firm" } },
    });
    expect(targets[2]?.settings).toEqual({ release: "build" });
  });

  it("gives one target per kind for an environment without regions", () => {
    const root = parseRunway("root", {
      version: 3,
      project: "acme",
      environments: { staging: { destinations: { services: "encore-cloud", docs: "mintlify" } } },
    });
    expect(deployTargets(root, "staging").map((target) => target.id)).toEqual([
      "staging/services",
      "staging/docs",
    ]);
  });

  it("throws for a missing environment and an undeclared dedicated region", () => {
    expect(() => deployTargets(DEPLOY_ROOT, "preview")).toThrow(RunwayUnresolvedError);
    const root = parseRunway("root", {
      version: 3,
      project: "acme",
      environments: {
        production: {
          destinations: { services: "encore-cloud" },
          dedicated: {
            firm: { tenant: "t", cloud: { name: "gcp", account: "firm" }, regions: ["us"] },
          },
        },
      },
    });
    expect(() => deployTargets(root, "production")).toThrow(RunwayUnresolvedError);
  });
});
