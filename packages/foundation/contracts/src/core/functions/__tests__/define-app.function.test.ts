/**
 * Stackra file contract:
 * Purpose: unit and type tests of `defineApp`: it returns its argument unchanged, takes the template's app
 *          definitions (targets, area, env class, tool sections), and refuses a missing area or an unknown target.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0295 (decisions 1 and
 *                     2).
 */
import { describe, expect, it } from "@stackra/testing";

import { ApiArea } from "#core/enums/api-area.enum";
import { Target } from "#core/enums/target.enum";
import { defineApp } from "#core/functions/define-app.function";

/** Stands in for an app's env Config class. */
class EnvConfig {
  readonly env = { apiOrigin: "EXPO_PUBLIC_API_ORIGIN" };
}

describe("defineApp", () => {
  it("returns the definition unchanged, so gen and the runtime see the same data", () => {
    const definition = { targets: [Target.Web], area: ApiArea.Public };
    expect(defineApp(definition)).toBe(definition);
  });

  it("takes identity, targets and one section per tool, as the template's mobile app writes them", () => {
    const mobile = defineApp({
      targets: [Target.Ios, Target.Android],
      area: ApiArea.App,
      env: EnvConfig,
      name: "Acme",
      scheme: "acme",
      ios: { bundleId: "example.acme.mobile", supportsTablet: true },
      android: { package: "example.acme.mobile" },
      e2e: { seeds: ["orders.demo"], profile: "e2e" },
    });
    expect(mobile.targets).toEqual(["ios", "android"]);
    expect(mobile["ios"]).toEqual({ bundleId: "example.acme.mobile", supportsTablet: true });
  });

  it("refuses an unknown target and a definition without an area", () => {
    // @ts-expect-error -- "watch" is not a Target
    const unknownTarget = defineApp({ targets: ["watch"], area: ApiArea.App });
    // @ts-expect-error -- an app states its API area
    const noArea = defineApp({ targets: [Target.Web] });
    expect([unknownTarget.targets, noArea.targets]).toEqual([["watch"], ["web"]]);
  });
});
