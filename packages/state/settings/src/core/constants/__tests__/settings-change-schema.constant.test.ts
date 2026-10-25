/**
 * Stackra file contract:
 * Purpose: unit tests of `SETTINGS_CHANGE_SCHEMA`: a diff row parses; a path deeper than one section is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { SETTINGS_CHANGE_SCHEMA } from "#core/constants/settings-change-schema.constant";

describe("SETTINGS_CHANGE_SCHEMA", () => {
  it("parses a change row and refuses a bad path", () => {
    const row = { group: "orders", path: "a", after: 1, lockedBefore: false, lockedAfter: true };
    expect(SETTINGS_CHANGE_SCHEMA.parse(row)).toEqual(row);
    expect(SETTINGS_CHANGE_SCHEMA.safeParse({ ...row, path: "a.b.c" }).success).toBe(false);
  });
});
