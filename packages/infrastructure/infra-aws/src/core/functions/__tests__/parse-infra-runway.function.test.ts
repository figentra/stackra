/**
 * Stackra file contract:
 * Purpose: unit tests of `parseInfraRunway`: a root runway narrows to the AWS foundation's view with its defaults;
 *          an unquoted account id, a malformed region, an over-long project name, backups kept past 35 days without
 *          `cryptoShredded` and a missing `providers.aws` are refused with their paths.
 * Boundary: test only; roots are built through `parseRunway`, so each is a valid root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4: the root runway is the one source).
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";

/** A root runway with the given `providers.aws` block (none when `null`) and project name. */
function rootWith(aws: Record<string, unknown> | null, project = "acme-platform") {
  return parseRunway("root", {
    version: 3,
    project,
    ...(aws === null ? {} : { providers: { aws } }),
    environments: {},
  });
}

/** A root runway whose production database keeps the given backups. */
function rootKeeping(backups: Record<string, unknown>) {
  return parseRunway("root", {
    version: 3,
    project: "acme",
    providers: { aws: { region: "me-central-1" } },
    environments: { production: { shared: { database: { backups } } } },
  });
}

describe("parseInfraRunway", () => {
  it("narrows the root and defaults the accounts and required tags", () => {
    const runway = parseInfraRunway(rootWith({ region: "me-central-1" }));

    expect(runway.project).toBe("acme-platform");
    expect(runway.providers.aws).toMatchObject({
      region: "me-central-1",
      accounts: {},
      requiredTags: [],
    });
  });

  it("refuses a malformed region with its path", () => {
    const root = rootWith({ region: "middle-east" });

    expect(() => parseInfraRunway(root)).toThrow(RunwayInvalidError);
    expect(() => parseInfraRunway(root)).toThrow(/providers\.aws\.region/);
  });

  it("refuses an account that is neither a 12-digit id nor a ref", () => {
    const root = rootWith({ region: "me-central-1", accounts: { prod: "12345" } });

    expect(() => parseInfraRunway(root)).toThrow(/providers\.aws\.accounts\.prod/);
  });

  it("refuses a project name past 32 characters", () => {
    const root = rootWith({ region: "me-central-1" }, "a".repeat(33));

    expect(() => parseInfraRunway(root)).toThrow(/project/);
  });

  it("refuses backups kept past 35 days unless they are crypto-shredded (ADR 0188 decision 3)", () => {
    expect(() => parseInfraRunway(rootKeeping({ retentionDays: 90 }))).toThrow(
      /environments\.production\.shared\.database\.backups\.retentionDays/,
    );
    expect(() => parseInfraRunway(rootKeeping({ retentionDays: 35 }))).not.toThrow();
    expect(() =>
      parseInfraRunway(rootKeeping({ retentionDays: 90, cryptoShredded: true })),
    ).not.toThrow();
  });

  it("refuses a root without providers.aws", () => {
    expect(() => parseInfraRunway(rootWith(null))).toThrow(/providers/);
  });
});
