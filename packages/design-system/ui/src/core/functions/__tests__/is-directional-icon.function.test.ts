/**
 * Stackra file contract:
 * Purpose: proves `isDirectionalIcon` marks arrows, chevrons, panel sides and the external link as directional and
 *          leaves symmetric, alignment and custom icons alone.
 * Boundary: the pure function alone.
 * Runtime: node
 * Governing contract: ADR 0060; ADR 0022 (test placement).
 */
import { isDirectionalIcon } from "#core/functions/is-directional-icon.function";

describe("isDirectionalIcon", () => {
  it.each([
    "arrow-left",
    "arrow-right",
    "chevron-right",
    "chevrons-left",
    "arrow-up-right",
    "panel-left-open",
    "external-link",
    "log-out",
  ])("mirrors %s", (name) => {
    expect(isDirectionalIcon(name)).toBe(true);
  });

  it.each([
    "check",
    "plus",
    "chevron-down",
    "arrow-up",
    "align-left",
    "text-align-start",
    "brand:right",
  ])("keeps %s as drawn", (name) => {
    expect(isDirectionalIcon(name)).toBe(false);
  });
});
