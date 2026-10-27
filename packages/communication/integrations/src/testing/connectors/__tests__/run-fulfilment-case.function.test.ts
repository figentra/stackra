/**
 * Stackra file contract:
 * Purpose: unit tests of `runFulfilmentCase` over a sample 3PL driver: a driver that finds an order by its reference
 *          before shipping it passes (both hand-overs return the fulfilment, then status and cancel run); a driver that
 *          hands the order over again fails with the case's name.
 * Boundary: test only. The sample driver names no vendor (ADR 0443 decision 8); real drivers and their recordings
 *           live with the OS integrations connectors.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0443 (decision 8); owner D3 2026-10-27; STA-793.
 */
import { describe, expect, it } from "@stackra/testing";

import type { Fulfilment, FulfilmentProviderConnector, FulfilmentRequest } from "#contracts/index";
import type { IntegrationApi } from "#core/index";
import type { FulfilmentCase } from "#testing/connectors/fulfilment-case.type";
import { runFulfilmentCase } from "#testing/connectors/run-fulfilment-case.function";

/** A sample 3PL driver: looks the reference up, then creates. */
class WarehouseFulfilment implements FulfilmentProviderConnector {
  readonly api: IntegrationApi;

  /** When set, never looks up, so a second hand-over goes out. */
  readonly forgetful: boolean;

  constructor(api: IntegrationApi, forgetful = false) {
    this.api = api;
    this.forgetful = forgetful;
  }

  async create(request: FulfilmentRequest): Promise<Fulfilment> {
    if (!this.forgetful) {
      const found = await this.api.get<{ orders: { id: string }[] }>("/orders", {
        query: { reference: request.reference },
      });
      if (found.orders[0] !== undefined)
        return { providerRef: found.orders[0].id, state: "accepted" };
    }
    const made = await this.api.post<{ id: string }>("/orders", {
      reference: request.reference,
      items: request.lines,
    });
    return { providerRef: made.id, state: "accepted" };
  }

  async status(providerRef: string): Promise<Fulfilment> {
    const order = await this.api.get<{ id: string; tracking?: string }>(`/orders/${providerRef}`);
    return order.tracking === undefined
      ? { providerRef, state: "in_progress" }
      : { providerRef, state: "shipped", carrier: "local", trackingNumber: order.tracking };
  }

  async cancel(providerRef: string): Promise<Fulfilment> {
    await this.api.post(`/orders/${providerRef}/cancel`);
    return { providerRef, state: "cancelled" };
  }
}

const REQUEST: FulfilmentRequest = {
  reference: "ord_1",
  lines: [{ sku: "TEE-M", quantity: 2 }],
  shipTo: { lines: ["1 King Fahd Rd"], locality: "Riyadh", country: "SA" },
  recipientName: "Sara",
  recipientPhone: "+966500000000",
};

const CASE: FulfilmentCase = {
  name: "hand over",
  certification: "pending",
  request: REQUEST,
  fulfilment: { providerRef: "W-1", state: "accepted" },
  steps: [
    { method: "status", args: ["W-1"], result: { providerRef: "W-1", state: "in_progress" } },
    { method: "cancel", args: ["W-1"], result: { providerRef: "W-1", state: "cancelled" } },
  ],
  exchanges: [
    { method: "GET", path: "/orders", query: { reference: "ord_1" }, answer: { orders: [] } },
    {
      method: "POST",
      path: "/orders",
      body: { reference: "ord_1", items: REQUEST.lines },
      answer: { id: "W-1" },
    },
    {
      method: "GET",
      path: "/orders",
      query: { reference: "ord_1" },
      answer: { orders: [{ id: "W-1" }] },
    },
    { method: "GET", path: "/orders/W-1", answer: { id: "W-1" } },
    { method: "POST", path: "/orders/W-1/cancel" },
  ],
};

describe(runFulfilmentCase, () => {
  it("hands over twice, finding the first, then runs the steps", async () => {
    await expect(runFulfilmentCase((api) => new WarehouseFulfilment(api), CASE)).resolves.toEqual([
      CASE.fulfilment,
      CASE.fulfilment,
      { providerRef: "W-1", state: "in_progress" },
      { providerRef: "W-1", state: "cancelled" },
    ]);
  });

  it("fails a driver that hands the order over again", async () => {
    await expect(
      runFulfilmentCase((api) => new WarehouseFulfilment(api, true), CASE),
    ).rejects.toThrow(/hand over/);
  });
});
