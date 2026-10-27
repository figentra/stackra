/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the root module and the two market-pack drivers are exported, and
 *          nothing `.` exports is exported again.
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";
import * as node from "#node/index";

describe("@stackra/payments/node", () => {
  it("exports exactly its values, none of them from another entry", () => {
    expect(Object.keys(node).sort()).toEqual([
      "MarketPackPaymentDefaultsDriver",
      "MarketPackRestrictedTenderProgramsDriver",
      "PaymentsModule",
    ]);
    for (const name of Object.keys(node)) expect(name in core).toBe(false);
  });
});
