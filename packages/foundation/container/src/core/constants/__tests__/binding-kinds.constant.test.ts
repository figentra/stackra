/**
 * Stackra file contract:
 * Purpose: unit tests of `BINDING_KINDS`: frozen, unique, snake_case kind codes that include the kinds this package
 *          registers as bindings (service, driver, explorer) and leave out the kinds that are values or tokens.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";

describe("BINDING_KINDS", () => {
  it("is a frozen list of unique snake_case codes", () => {
    expect(Object.isFrozen(BINDING_KINDS)).toBe(true);
    expect(new Set(BINDING_KINDS).size).toBe(BINDING_KINDS.length);
    for (const kind of BINDING_KINDS) expect(kind).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it("holds the bindings of this package and none of the value or token kinds", () => {
    expect(BINDING_KINDS).toEqual(expect.arrayContaining(["service", "driver", "explorer"]));
    for (const kind of ["module", "schema", "model", "config", "port", "enum"])
      expect(BINDING_KINDS).not.toContain(kind);
  });
});
