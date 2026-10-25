/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySeatLedgerDriver`: it is a `SeatLedger`; it counts and lists per scope and kind,
 *          records a held seat once, and releases one seat.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0242 (decision 2); owner XP-1.
 */
import { describe, expect, it } from "@stackra/testing";

import { SeatLedger } from "#contracts/ports/seat-ledger.port";
import { MemorySeatLedgerDriver } from "#core/drivers/memory-seat-ledger.driver";

const VENUE = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";
const RANA = "usr_01j9z3k4m5n6p7q8r9s0t1v2a1";
const since = new Date("2026-10-25T09:00:00Z");

describe("MemorySeatLedgerDriver", () => {
  it("counts, lists, assigns once and releases", async () => {
    const ledger = new MemorySeatLedgerDriver();
    expect(ledger).toBeInstanceOf(SeatLedger);
    await ledger.assign({ principal: RANA, seatKind: "provider", scope: VENUE, since });
    await ledger.assign({ principal: RANA, seatKind: "provider", scope: VENUE, since });
    await ledger.assign({ principal: RANA, seatKind: "full", scope: VENUE, since });
    expect(await ledger.count(VENUE, "provider")).toBe(1);
    expect(await ledger.list(VENUE)).toHaveLength(2);
    expect(await ledger.count(undefined, "provider")).toBe(0);
    expect(await ledger.release(VENUE, RANA, "provider")).toBe(true);
    expect(await ledger.count(VENUE, "provider")).toBe(0);
  });
});
