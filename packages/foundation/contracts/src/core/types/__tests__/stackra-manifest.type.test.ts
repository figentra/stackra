/**
 * Stackra file contract:
 * Purpose: tests of `StackraManifest` against a committed manifest: a copy of the template's loyalty-kit manifest
 *          reads through the type the way generated code reads it (`json as StackraManifest`), its identities have
 *          the derived shapes, and a hand-built manifest type-checks without a cast.
 * Boundary: test only; the fixture is a verbatim copy in `fixtures/`, refreshed by hand when the template's format
 *           changes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 10
 *                     and 20).
 */
import { describe, expect, it } from "@stackra/testing";

import type { StackraManifest } from "#core/types/stackra-manifest.type";

import json from "./fixtures/loyalty-kit.stackra.manifest.json" with { type: "json" };

/** Read exactly as the generated `#stackra/manifest` reads it. */
const manifest = json as StackraManifest;

describe("StackraManifest", () => {
  it("reads the member header", () => {
    expect(manifest.member).toBe("loyalty_kit");
    expect(manifest.package).toBe("@acme/loyalty-kit");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("reads locked action keys as <module>.<model>.<verb>@<major>", () => {
    const actions = manifest.actions ?? [];
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(action.key).toMatch(/^[a-z_]+\.[a-z_]+\.[a-z_]+@\d+$/);
      expect(action.risk).toMatch(/^L[0-4]$/);
      expect(action.permission.split(".")).toHaveLength(3);
    }
  });

  it("reads versioned event wire names as <module>.<name>.v<n>, domain ones without a version", () => {
    const events = manifest.events ?? [];
    expect(events.some((event) => event.version === undefined)).toBe(true);
    for (const event of events)
      if (event.version === undefined) expect(event.name).not.toMatch(/\.v\d+$/);
      else expect(event.name.endsWith(`.v${event.version}`)).toBe(true);
  });

  it("reads model public id prefixes of 2 to 6 letters and snake_case refusal codes", () => {
    for (const model of manifest.models ?? []) expect(model.publicId).toMatch(/^[a-z]{2,6}$/);
    for (const error of manifest.errors ?? []) expect(error.code).toMatch(/^[a-z]+(?:_[a-z]+)*$/);
  });

  it("reads port keys as <member>.<Port>", () => {
    for (const driver of manifest.drivers ?? [])
      expect(driver.key).toBe(`loyalty_kit.${driver.port}`);
  });

  it("keeps the sections other targets add open", () => {
    expect(manifest["infra"]).toBeDefined();
    expect(manifest["ui"]).toBeDefined();
  });

  it("type-checks a hand-built manifest without a cast", () => {
    const minimal: StackraManifest = {
      member: "theme",
      package: "@acme/theme",
      version: "0.1.0",
      modules: [{ key: "theme", dependsOn: [] }],
      themes: [{ key: "acme" }],
    };
    expect(minimal.modules?.[0]?.key).toBe("theme");
  });
});
