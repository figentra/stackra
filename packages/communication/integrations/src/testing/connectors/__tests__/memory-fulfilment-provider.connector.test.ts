/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFulfilmentProvider`: an order is handed over once per reference and read back, it
 *          ships with its carrier and tracking number, it cancels until it ships, and an unknown ref is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0447 (decision 2); STA-904.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FulfilmentRequest } from "#contracts/types/fulfilment-request.type";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { MemoryFulfilmentProvider } from "#testing/connectors/memory-fulfilment-provider.connector";

const REQUEST: FulfilmentRequest = {
  reference: "ord_1",
  lines: [{ sku: "TEE-M", quantity: 2 }],
  shipTo: { lines: ["1 King Fahd Rd"], locality: "Riyadh", country: "SA" },
  recipientName: "Sara",
  recipientPhone: "+966500000000",
};

describe(MemoryFulfilmentProvider, () => {
  it("hands an order over once per reference", async () => {
    const threePl = new MemoryFulfilmentProvider();
    const first = await threePl.create(REQUEST);
    expect(first).toEqual({ providerRef: "ful_1", state: "accepted" });
    await expect(threePl.create(REQUEST)).resolves.toBe(first);
    expect(threePl.received).toHaveLength(1);
    await expect(threePl.status("ful_1")).resolves.toBe(first);
  });

  it("ships with the carrier and tracking number, and refuses a cancel after", async () => {
    const threePl = new MemoryFulfilmentProvider();
    const { providerRef } = await threePl.create(REQUEST);
    threePl.ship(providerRef, "aramex", "AX123");
    await expect(threePl.status(providerRef)).resolves.toEqual({
      providerRef,
      state: "shipped",
      carrier: "aramex",
      trackingNumber: "AX123",
    });
    const refused = await threePl.cancel(providerRef).catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 409, code: "shipped" })).toBe(true);
  });

  it("cancels before shipping and refuses an unknown ref", async () => {
    const threePl = new MemoryFulfilmentProvider();
    const { providerRef } = await threePl.create(REQUEST);
    await expect(threePl.cancel(providerRef)).resolves.toMatchObject({ state: "cancelled" });
    const refused = await threePl.status("ful_9").catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 404, code: "not_found" })).toBe(true);
  });
});
