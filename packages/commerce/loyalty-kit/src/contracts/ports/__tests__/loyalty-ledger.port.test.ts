/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyLedger`: an abstract port a host class can implement, whose methods take the branded
 *          member and the points entry.
 * Boundary: test only; a minimal host ledger stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { MemberId } from "#contracts/types/member-id.type";
import type { PointsEntry } from "#contracts/types/points-entry.type";

/** A ledger of the kind a host writes for a test: every member holds nothing. */
class EmptyLedger extends LoyaltyLedger {
  async balance(): Promise<number> {
    return 0;
  }

  async append(): Promise<boolean> {
    return true;
  }

  async debit(): Promise<DebitOutcome> {
    return DebitOutcome.Uncovered;
  }

  async find(): Promise<null> {
    return null;
  }

  async expire(): Promise<number> {
    return 0;
  }
}

describe("LoyaltyLedger", () => {
  it("is an abstract port a host class implements", async () => {
    const ledger = new EmptyLedger();
    expect(ledger).toBeInstanceOf(Port);
    expect(ledger).toBeInstanceOf(LoyaltyLedger);
    expect(await ledger.debit()).toBe(DebitOutcome.Uncovered);
  });

  it("takes the branded member and the points entry", () => {
    expectTypeOf<Parameters<LoyaltyLedger["balance"]>[0]>().toEqualTypeOf<MemberId>();
    expectTypeOf<Parameters<LoyaltyLedger["debit"]>[0]>().toEqualTypeOf<PointsEntry>();
    expectTypeOf<ReturnType<LoyaltyLedger["debit"]>>().toEqualTypeOf<Promise<DebitOutcome>>();
  });
});
