/**
 * Stackra file contract:
 * Purpose: unit tests of `STATE_CONFIG_SCHEMA`: `.parse({})` gives the defaults, values of the wrong type or an empty
 *          area are refused, and the generated host form `Base$.shape.persistStore.unwrap().default(...)` works.
 * Boundary: test only; the host form is the template's generated `StateConfig$` for the mobile app.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { STATE_CONFIG_SCHEMA } from "#core/constants/state-config-schema.constant";

describe("STATE_CONFIG_SCHEMA", () => {
  it("parses an empty object to the defaults", () => {
    expect(STATE_CONFIG_SCHEMA.parse({})).toEqual({
      persistStore: "prefs",
      blockingHydration: false,
      devtoolsInProduction: false,
    });
  });

  it("refuses a value of the wrong type or an empty area", () => {
    expect(STATE_CONFIG_SCHEMA.safeParse({ blockingHydration: "yes" }).success).toBe(false);
    expect(STATE_CONFIG_SCHEMA.safeParse({ persistStore: "" }).success).toBe(false);
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = STATE_CONFIG_SCHEMA.extend({
      persistStore: STATE_CONFIG_SCHEMA.shape.persistStore.unwrap().default("session"),
      blockingHydration: STATE_CONFIG_SCHEMA.shape.blockingHydration.unwrap().default(true),
    });
    expect(Host$.parse({})).toEqual({
      persistStore: "session",
      blockingHydration: true,
      devtoolsInProduction: false,
    });
  });
});
