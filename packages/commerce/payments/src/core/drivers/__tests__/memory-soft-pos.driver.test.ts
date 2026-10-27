/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySoftPosDriver`: not ready until connected, a collect answers the set state (authorised
 *          by default) and a cancel is counted.
 * Boundary: test only; pure in-memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0446.
 */
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { MemorySoftPosDriver } from "#core/drivers/memory-soft-pos.driver";

const session = { providerRef: "pi_1", terminalId: "phone_1", status: PaymentStatus.Pending };

describe("MemorySoftPosDriver", () => {
  it("is ready once connected, collects and counts cancels", async () => {
    const softPos = new MemorySoftPosDriver();
    expect(await softPos.readiness()).toEqual({ ready: false, reason: "not_connected" });
    await softPos.connect("tml_loc_1");
    expect(await softPos.readiness()).toEqual({ ready: true });
    expect((await softPos.collect(session)).status).toBe(PaymentStatus.Authorized);
    softPos.answer(PaymentStatus.Captured);
    expect((await softPos.collect(session)).status).toBe(PaymentStatus.Captured);
    await softPos.cancel();
    expect(softPos.cancels).toBe(1);
  });
});
