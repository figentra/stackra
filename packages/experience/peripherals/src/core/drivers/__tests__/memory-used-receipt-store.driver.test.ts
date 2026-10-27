/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryUsedReceiptStoreDriver`: a receipt is claimed once, a released receipt can be claimed
 *          again, and every call refuses with capability `network` while absent.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0429 (decision 3); ADR 0449 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { UsedReceiptStore } from "#contracts/ports/used-receipt-store.port";
import { MemoryUsedReceiptStoreDriver } from "#core/drivers/memory-used-receipt-store.driver";

const UNTIL = new Date("2026-10-27T10:30:00Z");

describe("MemoryUsedReceiptStoreDriver", () => {
  it("claims a receipt once, and again after a release", async () => {
    const store = new MemoryUsedReceiptStoreDriver();
    expect(store).toBeInstanceOf(UsedReceiptStore);
    expect(await store.claim("rct_1", UNTIL)).toEqual({ ok: true, data: true });
    expect(await store.claim("rct_1", UNTIL)).toEqual({ ok: true, data: false });
    expect(await store.release("rct_1")).toEqual({ ok: true, data: undefined });
    expect(await store.claim("rct_1", UNTIL)).toEqual({ ok: true, data: true });
  });

  it("refuses while absent", async () => {
    const store = new MemoryUsedReceiptStoreDriver();
    store.isPresent = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "network" } };
    expect(await store.claim("rct_1", UNTIL)).toEqual(refused);
    expect(await store.release("rct_1")).toEqual(refused);
  });
});
