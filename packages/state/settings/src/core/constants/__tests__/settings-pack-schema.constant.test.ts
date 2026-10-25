/**
 * Stackra file contract:
 * Purpose: unit tests of `SETTINGS_PACK_SCHEMA`: a valid pack parses with `locked` defaulted; a lock without a value
 *          and an object value are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { SETTINGS_PACK_SCHEMA } from "#core/constants/settings-pack-schema.constant";

describe("SETTINGS_PACK_SCHEMA", () => {
  it("parses a pack and defaults locked", () => {
    expect(
      SETTINGS_PACK_SCHEMA.parse({ groups: { loyalty_kit: { values: { "s.a": 1 } } } }),
    ).toEqual({
      groups: { loyalty_kit: { values: { "s.a": 1 }, locked: [] } },
    });
  });

  it("refuses a lock without a value and an object value", () => {
    expect(
      SETTINGS_PACK_SCHEMA.safeParse({ groups: { o: { values: {}, locked: ["a"] } } }).success,
    ).toBe(false);
    expect(SETTINGS_PACK_SCHEMA.safeParse({ groups: { o: { values: { a: [] } } } }).success).toBe(
      false,
    );
  });
});
