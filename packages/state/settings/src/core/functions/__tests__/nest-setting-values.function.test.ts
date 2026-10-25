/**
 * Stackra file contract:
 * Purpose: unit tests of `nestSettingValues`: section paths nest one level deep.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 22); ADR 0213 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { nestSettingValues } from "#core/functions/nest-setting-values.function";

describe("nestSettingValues", () => {
  it("nests section paths one level deep", () => {
    expect(nestSettingValues({ a: 1, "s.b": 2, "s.c": 3 })).toEqual({ a: 1, s: { b: 2, c: 3 } });
  });
});
