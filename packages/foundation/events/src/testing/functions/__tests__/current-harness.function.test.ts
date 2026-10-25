/**
 * Stackra file contract:
 * Purpose: unit tests of `currentHarness`: it throws before any testing app compiled and returns the harness of the
 *          app compiled last afterwards.
 * Boundary: test only; vitest gives each file its own module state, so no app has compiled when the file starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { EventBus } from "#core/index";
import "#testing/index";
import { currentHarness } from "#testing/functions/current-harness.function";

class FixtureModule extends Module {}

registerWiring({ member: "fixture", root: FixtureModule });

describe(currentHarness, () => {
  it("throws before an app compiled, then returns the last app's harness", async () => {
    expect(() => currentHarness()).toThrow(/createTestingModule/);
    await createTestingModule(FixtureModule).compile();
    const first = currentHarness();
    await createTestingModule(FixtureModule).compile();
    const second = currentHarness();

    expect(second).not.toBe(first);
    expect(second.bus).toBeInstanceOf(EventBus);
  });
});
