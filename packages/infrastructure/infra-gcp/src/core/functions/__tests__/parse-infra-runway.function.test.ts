/**
 * Stackra file contract:
 * Purpose: unit tests of `parseInfraRunway`: a root runway narrows to the GCP foundation's view with its defaults; a
 *          malformed region, an unquoted project number, a bad Postgres version, a bad label key, more than ten static
 *          egress addresses and a missing `providers.gcp` are refused with their paths.
 * Boundary: test only; roots are built through `parseRunway`, so each is a valid root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 4), ADR 0171 (decision 4: the root runway is the
 *                     one source).
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";

/** A root runway with the given `providers.gcp` block (none when `null`). */
function rootWith(gcp: Record<string, unknown> | null) {
  return parseRunway("root", {
    version: 3,
    project: "acme",
    ...(gcp === null ? {} : { providers: { gcp } }),
    environments: {},
  });
}

describe("parseInfraRunway", () => {
  it("narrows the root and defaults the projects, regions and required labels", () => {
    const runway = parseInfraRunway(rootWith({ region: "europe-west3" }));

    expect(runway.project).toBe("acme");
    expect(runway.regions).toEqual({});
    expect(runway.providers.gcp).toMatchObject({
      region: "europe-west3",
      projects: {},
      requiredLabels: [],
    });
  });

  it("refuses a malformed region with its path", () => {
    const root = rootWith({ region: "dammam" });

    expect(() => parseInfraRunway(root)).toThrow(RunwayInvalidError);
    expect(() => parseInfraRunway(root)).toThrow(/providers\.gcp\.region/);
  });

  it("refuses a project number YAML read as a number", () => {
    const root = rootWith({
      region: "europe-west3",
      projects: { prod: { id: "acme-prod", number: 123_456_789_012 } },
    });

    expect(() => parseInfraRunway(root)).toThrow(/providers\.gcp\.projects\.prod\.number/);
  });

  it("refuses a Postgres version Cloud SQL does not name and an upper-case label key", () => {
    const root = parseRunway("root", {
      version: 3,
      project: "acme",
      providers: { gcp: {} },
      environments: { production: { shared: { database: { version: "17" } } } },
    });
    expect(() => parseInfraRunway(root)).toThrow(
      /environments\.production\.shared\.database\.version/,
    );
    expect(() =>
      parseInfraRunway(rootWith({ region: "europe-west3", requiredLabels: ["Team"] })),
    ).toThrow(/providers\.gcp\.requiredLabels\.0/);
  });

  it("refuses more static egress addresses than partners can allow-list", () => {
    const root = parseRunway("root", {
      version: 3,
      project: "acme",
      providers: { gcp: {} },
      environments: { production: { shared: { network: { egress: { staticIps: 11 } } } } },
    });

    expect(() => parseInfraRunway(root)).toThrow(
      /environments\.production\.shared\.network\.egress\.staticIps/,
    );
  });

  it("refuses a root without providers.gcp", () => {
    expect(() => parseInfraRunway(rootWith(null))).toThrow(/providers/);
  });
});
