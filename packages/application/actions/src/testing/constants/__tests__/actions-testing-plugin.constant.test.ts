/**
 * Stackra file contract:
 * Purpose: unit tests of `ACTIONS_TESTING_PLUGIN`: it is registered as `@stackra/actions`; `.withExtensions` adds
 *          inline implementers to that module's slots (calls add up, in order), and the next compile without it clears
 *          them; every compile sets the pipeline `run` uses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { ExtensionPoint } from "#core/index";
import { ACTIONS_TESTING_PLUGIN } from "#testing/constants/actions-testing-plugin.constant";
import { CURRENT_PIPELINE } from "#testing/constants/current-pipeline.constant";
import { extension } from "#testing/functions/extension.function";
import { fakeExtensionContext } from "#testing/functions/fake-extension-context.function";

class PricingPoint extends ExtensionPoint {
  readonly adjust = ExtensionPoint.after<number, []>();
}

class FixtureModule extends Module {}

registerWiring({ member: "fixture", root: FixtureModule });

describe("ACTIONS_TESTING_PLUGIN", () => {
  it("is the actions plugin with a withExtensions builder method", () => {
    expect(ACTIONS_TESTING_PLUGIN.name).toBe("@stackra/actions");
    expect(Object.keys(ACTIONS_TESTING_PLUGIN.builder ?? {})).toEqual(["withExtensions"]);
  });

  it("connects a module's inline extensions, and clears them on the next compile", async () => {
    const ctx = fakeExtensionContext();
    const app = await createTestingModule(FixtureModule)
      .withExtensions([extension(PricingPoint, "adjust", { order: 20 }, (value) => value * 2)])
      .withExtensions([extension(PricingPoint, "adjust", { order: 10 }, (value) => value + 1)])
      .compile();
    expect(CURRENT_PIPELINE.value?.app).toBe(app);
    expect(await new PricingPoint().adjust(5, ctx)).toBe(12);
    await createTestingModule(FixtureModule).compile();
    expect(await new PricingPoint().adjust(5, ctx)).toBe(5);
  });
});
