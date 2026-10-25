/**
 * Stackra file contract:
 * Purpose: unit tests of `settingsPackFromYaml`: a pack reads with `locked` defaulted; text that is not a pack (an
 *          object value, a lock without a value, a bad group key) throws.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { settingsPackFromYaml } from "#core/functions/settings-pack-from-yaml.function";

describe("settingsPackFromYaml", () => {
  it("reads a pack and defaults locked to empty", () => {
    expect(settingsPackFromYaml("groups:\n  orders:\n    values:\n      a: 1\n")).toEqual({
      groups: { orders: { values: { a: 1 }, locked: [] } },
    });
  });

  it("refuses what is not a pack", () => {
    expect(() =>
      settingsPackFromYaml("groups:\n  orders:\n    values:\n      a:\n        b: 1\n"),
    ).toThrow();
    expect(() =>
      settingsPackFromYaml("groups:\n  orders:\n    values: {}\n    locked: [a]\n"),
    ).toThrow();
    expect(() => settingsPackFromYaml("groups:\n  Orders:\n    values: {}\n")).toThrow();
  });
});
