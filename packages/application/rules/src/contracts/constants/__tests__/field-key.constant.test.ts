/**
 * Stackra file contract:
 * Purpose: unit tests of `FIELD_KEY`: camelCase keys of 1 to 63 characters pass; snake_case, a leading capital or
 *          digit, a dot and a 64-character key are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decision 4); STA-1250.
 */
import { describe, expect, it } from "@stackra/testing";

import { FIELD_KEY } from "#contracts/constants/field-key.constant";

describe("FIELD_KEY", () => {
  it("takes camelCase keys", () => {
    for (const key of ["a", "channelId", "total2", `a${"b".repeat(62)}`])
      expect(FIELD_KEY.test(key)).toBe(true);
  });

  it("refuses every other casing", () => {
    for (const key of [
      "channel_id",
      "ChannelId",
      "2fa",
      "record.channelId",
      "",
      `a${"b".repeat(63)}`,
    ])
      expect(FIELD_KEY.test(key)).toBe(false);
  });
});
