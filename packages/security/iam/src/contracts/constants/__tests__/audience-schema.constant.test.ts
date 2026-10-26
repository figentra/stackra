/**
 * Stackra file contract:
 * Purpose: unit tests of `AUDIENCE_SCHEMA` (`Audience$`): a scope, a segment and a role parse, and an unknown kind is
 *          refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { AUDIENCE_SCHEMA } from "#contracts/constants/audience-schema.constant";

const ID = "01HZX3K9M2Q7R8S5T6V4W1Y0AB";

describe("Audience$", () => {
  it("parses a scope, a segment and a role", () => {
    for (const audience of [
      { id: `scp_${ID}`, path: "platform.acme" },
      { kind: "segment", id: `seg_${ID}` },
      { kind: "role", key: "manager" },
    ])
      expect(AUDIENCE_SCHEMA.parse(audience)).toEqual(audience);
  });

  it("refuses an unknown kind", () => {
    expect(AUDIENCE_SCHEMA.safeParse({ kind: "team", key: "ops" }).success).toBe(false);
  });
});
