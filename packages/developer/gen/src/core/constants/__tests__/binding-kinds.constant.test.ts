/**
 * Stackra file contract:
 * Purpose: unit tests of gen's `BINDING_KINDS`: frozen, unique snake_case codes that include the client and point kinds
 *          a wiring binds (menu, shortcut, store, bridge, extension_point; STA-2055).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";

describe("BINDING_KINDS", () => {
  it("is a frozen list of unique snake_case codes", () => {
    expect(Object.isFrozen(BINDING_KINDS)).toBe(true);
    expect(new Set(BINDING_KINDS).size).toBe(BINDING_KINDS.length);
    for (const kind of BINDING_KINDS) expect(kind).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it("holds the five client and point kinds", () => {
    expect(BINDING_KINDS).toEqual(
      expect.arrayContaining(["menu", "shortcut", "store", "bridge", "extension_point"]),
    );
  });
});
