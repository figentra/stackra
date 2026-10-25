/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports exactly `rememberActiveScope`, and keeps the
 *          storage key internal.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import * as native from "#native/index";

describe("@stackra/scope/native", () => {
  it("exports exactly rememberActiveScope", () => {
    expect(Object.keys(native)).toEqual(["rememberActiveScope"]);
    expect("ACTIVE_SCOPE_STORAGE_KEY" in native).toBe(false);
  });
});
