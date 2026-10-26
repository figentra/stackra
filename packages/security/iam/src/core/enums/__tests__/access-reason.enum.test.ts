/**
 * Stackra file contract:
 * Purpose: unit test of `AccessReason`: the reasons an explanation carries into the audit record, with their stored
 *          snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 3).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AccessReason } from "#core/enums/access-reason.enum";

describe("AccessReason", () => {
  it("holds the six reasons", () => {
    expect(Enum.values(AccessReason)).toEqual([
      "granted",
      "platform",
      "not_granted",
      "denied",
      "system_only",
      "break_glass",
    ]);
  });
});
