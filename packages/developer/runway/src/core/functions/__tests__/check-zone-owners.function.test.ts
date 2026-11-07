/**
 * Stackra file contract:
 * Purpose: unit tests of `checkZoneOwners` and of the zone shape `parseRunway` accepts: a plain zone id still parses;
 *          the object form takes `owner`, `plan` and `policy`; an unknown key, a strict policy on Free, an owner with no
 *          plan and a policy on a non-owner fail the schema; two runways that own one zone are reported once, and one
 *          owner with readers passes.
 * Boundary: test only; roots are built through `parseRunway`. The zone names are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0519 (decisions 5 and 6); STA-1993.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkZoneOwners } from "#core/functions/check-zone-owners.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** A root runway whose Cloudflare zones are `zones`. */
const rootWith = (zones: Record<string, unknown>) =>
  parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: {},
    providers: { cloudflare: { accountId: "acct", zones } },
  });

const OWNER = { id: "z1", owner: true, plan: "free", policy: "baseline" };

describe("zones", () => {
  it("accepts a plain id and the owner form", () => {
    expect(() => rootWith({ "a.example": "z0", "b.example": OWNER })).not.toThrow();
  });

  it("accepts the strict policy on Pro", () => {
    expect(() =>
      rootWith({ "a.example": { ...OWNER, plan: "pro", policy: "strict" } }),
    ).not.toThrow();
  });

  it.each([
    ["an unknown key", { ...OWNER, hsts: true }],
    ["strict on Free", { ...OWNER, policy: "strict" }],
    ["an owner without a plan", { id: "z1", owner: true }],
    ["a policy on a reader", { id: "z1", plan: "free", policy: "baseline" }],
    ["a plan the schema does not know", { ...OWNER, plan: "enterprise" }],
  ])("refuses %s", (_name, zone) => {
    expect(() => rootWith({ "a.example": zone })).toThrow();
  });
});

describe("checkZoneOwners", () => {
  it("passes one owner and any number of readers", () => {
    const issues = checkZoneOwners([
      { source: "core", root: rootWith({ "a.example": OWNER }) },
      { source: "os", root: rootWith({ "a.example": "z1" }) },
      { source: "commerce", root: rootWith({ "a.example": { id: "z1" } }) },
    ]);
    expect(issues).toEqual([]);
  });

  it("reports a zone two runways own, once, naming both", () => {
    const issues = checkZoneOwners([
      { source: "core", root: rootWith({ "a.example": OWNER, "b.example": OWNER }) },
      { source: "os", root: rootWith({ "a.example": OWNER }) },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ subject: "a.example", owners: ["core", "os"] });
  });
});
