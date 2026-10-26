/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectedAccountLimitsFake`: no cap and no hold unless set, the set ones per connection, and
 *          every question recorded.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";

describe("ConnectedAccountLimitsFake", () => {
  it("answers the caps and holds a test sets, and records each question", async () => {
    const cap = Money.ofMinor(50_000, "USD");
    const limits = ConnectedAccountLimitsFake.with({ caps: { conn_1: cap }, held: ["conn_1"] });
    expect(await limits.cap("conn_1")).toBe(cap);
    expect(await limits.cap("conn_2")).toBeNull();
    expect(await limits.payoutHeld("conn_1")).toBe(true);
    expect(await limits.payoutHeld("conn_2")).toBe(false);
    expect(limits.asked).toEqual(["conn_1", "conn_2", "conn_1", "conn_2"]);
  });
});
