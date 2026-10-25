/**
 * Stackra file contract:
 * Purpose: unit tests of `checkRegions` and of the region shape `parseRunway` accepts: two clouds with their provider
 *          sections pass; a region whose cloud has no provider section and an environment naming an undeclared region
 *          are reported; a region without a cloud, an unknown cloud and a region listed twice fail the schema.
 * Boundary: test only; roots are built through `parseRunway`, so each is a checked shape. The regions are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 4 and enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkRegions } from "#core/functions/check-regions.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** A root runway with `extra` merged in. */
const rootWith = (extra: Record<string, unknown>) =>
  parseRunway("root", { version: 3, project: "acme-platform", environments: {}, ...extra });

const regions = {
  eu: { cloud: "aws", location: "eu-central-1", account: "ref:aws/eu" },
  sa: { cloud: "gcp", location: "me-central2", account: "ref:gcp/sa", jurisdiction: "sa" },
};

describe("checkRegions", () => {
  it("passes two clouds with their provider sections", () => {
    const root = rootWith({
      providers: { aws: {}, gcp: { projects: { sa: "ref:gcp/sa" } } },
      regions,
      environments: { production: { regions: ["eu", "sa"] } },
    });
    expect(checkRegions(root)).toEqual([]);
  });

  it("reports a cloud with no provider section and an undeclared region", () => {
    const root = rootWith({
      providers: { aws: {} },
      regions,
      environments: { staging: { regions: ["eu"] }, production: { regions: ["eu", "us"] } },
    });
    expect(checkRegions(root)).toEqual([
      expect.objectContaining({ code: "cloud_unconfigured", subject: "sa" }),
      expect.objectContaining({ environment: "production", code: "unknown_region", subject: "us" }),
    ]);
  });

  it("refuses a region without a cloud, an unknown cloud and a repeated region", () => {
    expect(() => rootWith({ regions: { eu: { location: "eu-central-1" } } })).toThrow(
      RunwayInvalidError,
    );
    expect(() => rootWith({ regions: { eu: { cloud: "azure", location: "x" } } })).toThrow(
      RunwayInvalidError,
    );
    expect(() =>
      rootWith({ regions, environments: { production: { regions: ["eu", "eu"] } } }),
    ).toThrow(RunwayInvalidError);
  });
});
