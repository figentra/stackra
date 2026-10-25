/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StateConfig`: a configuration over `StateOptions` keyed `state`, built with its
 *          defaults, the template's console override (an area code restated under a narrower type, blocking
 *          hydration) and a runway values layer, frozen once built.
 * Boundary: test only; the override is the template's `apps/console/src/config/state.config.ts` with the storage enum
 *           replaced by a local code union (this package does not depend on storage).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 20); ADR 0079.
 */
import { buildConfig, Config, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { StateConfig } from "#config/state.config";
import { STATE_CONFIG_SCHEMA } from "#core/constants/state-config-schema.constant";

/** Stands in for `StorageArea`: a plain code union. */
type Area = "prefs" | "session";

/** The template's override, under the plain name with the package class aliased. */
const BaseStateConfig = StateConfig;

class ConsoleStateConfig extends BaseStateConfig {
  override persistStore: Area = "prefs";

  override devtoolsInProduction = false;

  override blockingHydration = true;
}

describe("StateConfig", () => {
  it("is a configuration keyed state, an override inheriting the key", () => {
    expect(new StateConfig()).toBeInstanceOf(Config);
    expect(configKey(StateConfig, "state")).toBe("state");
    expect(configKey(ConsoleStateConfig, "state")).toBe("state");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(StateConfig);
    expectTypeOf(config.persistStore).toEqualTypeOf<string>();
    expectTypeOf(config.blockingHydration).toEqualTypeOf<boolean>();
    expect({ ...config }).toEqual(STATE_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the template's override", () => {
    expect({ ...buildConfig(ConsoleStateConfig) }).toEqual({
      persistStore: "prefs",
      blockingHydration: true,
      devtoolsInProduction: false,
    });
  });

  it("takes a runway values layer", () => {
    expect(buildConfig(StateConfig, { values: { persistStore: "session" } }).persistStore).toBe(
      "session",
    );
  });
});
