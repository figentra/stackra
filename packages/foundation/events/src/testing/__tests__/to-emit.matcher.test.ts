/**
 * Stackra file contract:
 * Purpose: unit tests of `toEmit`: on a list it searches the list; on any other subject it searches what the current
 *          app published; `.not` inverts it; the failure message names what was emitted.
 * Boundary: test only; importing the entry registers the matcher and the plugin.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/index";
import { toEmit } from "#testing/index";
import { dispatch } from "#testing/functions/dispatch.function";

class PointsEarned extends DomainEvent {
  points!: number;
}

class OrderPaid extends DomainEvent {}

class AccountService {}

class FixtureModule extends Module {}

registerWiring({ member: "fixture", root: FixtureModule });

const earned = Object.assign(new PointsEarned(), { points: 100 });

describe(toEmit, () => {
  it("searches a received list", () => {
    expect([earned]).toEmit(PointsEarned, { points: 100 });
    expect([earned]).not.toEmit(OrderPaid);
  });

  it("searches the current app's published events for any other subject", async () => {
    await createTestingModule(FixtureModule).compile();
    const accounts = new AccountService();
    expect(accounts).not.toEmit(PointsEarned);
    await dispatch(earned);
    expect(accounts).toEmit(PointsEarned, { points: 100 });
    expect(() => expect(accounts).toEmit(OrderPaid)).toThrow(
      /to emit OrderPaid .*emitted \[PointsEarned\]/,
    );
  });
});
