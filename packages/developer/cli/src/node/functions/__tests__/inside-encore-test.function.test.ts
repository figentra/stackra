/**
 * Stackra file contract:
 * Purpose: unit tests of `insideEncoreTest`: any one of the runtime configuration or app metadata variables `encore
 *          test` sets marks the inside; none, or only empty ones, is the outside.
 * Boundary: test only; plain objects stand in for the environment.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 3); STA-2838.
 */
import { describe, expect, it } from "@stackra/testing";

import { insideEncoreTest } from "#node/functions/inside-encore-test.function";

describe(insideEncoreTest, () => {
  it("is inside when encore test handed over its runtime configuration or app metadata", () => {
    for (const name of [
      "ENCORE_RUNTIME_CONFIG",
      "ENCORE_RUNTIME_CONFIG_PATH",
      "ENCORE_APP_META",
      "ENCORE_APP_META_PATH",
    ])
      expect(insideEncoreTest({ [name]: "set" })).toBe(true);
  });

  it("is outside with none of them, or only empty ones", () => {
    expect(insideEncoreTest({})).toBe(false);
    expect(insideEncoreTest({ ENCORE_RUNTIME_CONFIG: "", PATH: "/usr/bin" })).toBe(false);
  });
});
