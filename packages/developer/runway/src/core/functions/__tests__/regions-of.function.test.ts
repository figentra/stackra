/**
 * Stackra file contract:
 * Purpose: unit tests of `regionsOf`: an environment's regions resolve in its release order with their cloud, cloud
 *          region, account and jurisdiction; an environment with none gives none; an undeclared region throws.
 * Boundary: test only; roots are built through `parseRunway`. The regions are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { parseRunway } from "#core/functions/parse-runway.function";
import { regionsOf } from "#core/functions/regions-of.function";

const root = parseRunway("root", {
  version: 3,
  project: "acme-platform",
  regions: {
    eu: { cloud: "aws", location: "eu-central-1" },
    sa: { cloud: "gcp", location: "me-central2", account: "ref:gcp/sa", jurisdiction: "sa" },
  },
  environments: {
    staging: {},
    production: { regions: ["sa", "eu"] },
    preview: { regions: ["us"] },
  },
});

describe("regionsOf", () => {
  it("resolves the regions in release order", () => {
    expect(regionsOf(root, "production")).toEqual([
      {
        key: "sa",
        cloud: "gcp",
        location: "me-central2",
        account: "ref:gcp/sa",
        jurisdiction: "sa",
      },
      { key: "eu", cloud: "aws", location: "eu-central-1" },
    ]);
  });

  it("gives none for an environment that lists none", () => {
    expect(regionsOf(root, "staging")).toEqual([]);
    expect(regionsOf(root, "dev")).toEqual([]);
  });

  it("throws for an undeclared region", () => {
    expect(() => regionsOf(root, "preview")).toThrow(RunwayUnresolvedError);
  });
});
