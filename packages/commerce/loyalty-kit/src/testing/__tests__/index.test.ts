/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the fake, the fixture, the matcher, both factories and the
 *          demo seeder are its values.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/loyalty-kit/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "LedgerEntryFactory",
      "LoyaltyAccountFactory",
      "LoyaltyKitDemoSeeder",
      "LoyaltyMembersFake",
      "pointsEntry",
      "toHaveBalance",
    ]);
  });
});
