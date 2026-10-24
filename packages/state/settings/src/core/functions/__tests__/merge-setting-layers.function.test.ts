/**
 * Stackra file contract:
 * Purpose: unit tests of `mergeSettingLayers`: an inner value replaces an outer one, a lock pins the value stored or
 *          inherited so far for every layer below, and no layer gives no value.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { mergeSettingLayers } from "#core/functions/merge-setting-layers.function";

describe("mergeSettingLayers", () => {
  it("lets the inner value win", () => {
    expect(
      mergeSettingLayers([
        { values: { a: 1, b: 1 }, locked: [] },
        { values: { a: 2 }, locked: [] },
      ]),
    ).toEqual({ values: { a: 2, b: 1 }, locked: [] });
  });

  it("pins a locked value for every layer below", () => {
    expect(
      mergeSettingLayers([
        { values: { a: 1 }, locked: ["a"] },
        { values: { a: 2, b: 2 }, locked: [] },
        { values: { a: 3 }, locked: [] },
      ]),
    ).toEqual({ values: { a: 1, b: 2 }, locked: ["a"] });
  });

  it("pins an inherited value a layer locks without storing it", () => {
    expect(
      mergeSettingLayers([
        { values: { a: 1 }, locked: [] },
        { values: {}, locked: ["a"] },
        { values: { a: 3 }, locked: [] },
      ]),
    ).toEqual({ values: { a: 1 }, locked: ["a"] });
  });

  it("gives nothing for no layer", () => {
    expect(mergeSettingLayers([])).toEqual({ values: {}, locked: [] });
  });
});
