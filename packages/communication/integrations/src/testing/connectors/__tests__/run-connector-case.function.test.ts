/**
 * Stackra file contract:
 * Purpose: unit tests of `runConnectorCase` over a sample driver of a made-up contract: a driver that matches its
 *          recording passes and returns each step's result; a different result, a refusal that does not come, a
 *          missing method or a recorded call left unmade fails with the case's name, and an expected refusal passes.
 * Boundary: test only. The sample contract and driver name no vendor (ADR 0443 decision 8).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0443 (decision 8); owner D3 2026-10-27; STA-793.
 */
import { describe, expect, it } from "@stackra/testing";

import type { IntegrationApi } from "#core/index";
import type { ConnectorCase } from "#testing/connectors/connector-case.type";
import { runConnectorCase } from "#testing/connectors/run-connector-case.function";

/** A made-up connector contract. */
interface Shelf {
  stock(sku: string): Promise<number>;
  restock(sku: string, quantity: number): Promise<void>;
  archive?(sku: string): Promise<void>;
}

/** A sample driver of `Shelf`. */
class RestShelf implements Shelf {
  readonly api: IntegrationApi;

  constructor(api: IntegrationApi) {
    this.api = api;
  }

  async stock(sku: string): Promise<number> {
    return (await this.api.get<{ available: number }>(`/items/${sku}`)).available;
  }

  async restock(sku: string, quantity: number): Promise<void> {
    await this.api.put(`/items/${sku}`, { available: quantity });
  }
}

/** Builds the sample driver as a `Shelf`, so a case may name the contract's optional `archive`. */
const restShelf = (api: IntegrationApi): Shelf => new RestShelf(api);

const RESTOCK = { method: "restock", args: ["TEE", 5] } as const;
const READ = { method: "GET", path: "/items/TEE", answer: { available: 5 } } as const;

const CASE: ConnectorCase<Shelf> = {
  name: "restock",
  certification: "pending",
  steps: [
    RESTOCK,
    { method: "stock", args: ["TEE"], result: 5 },
    { method: "stock", args: ["GONE"], refusal: { status: 404, code: "not_found" } },
  ],
  exchanges: [
    { method: "PUT", path: "/items/TEE", body: { available: 5 } },
    READ,
    { method: "GET", path: "/items/GONE", refusal: { status: 404, code: "not_found" } },
  ],
};

describe(runConnectorCase, () => {
  it("passes a driver that matches its recording", async () => {
    await expect(runConnectorCase(restShelf, CASE)).resolves.toEqual([undefined, 5, undefined]);
  });

  it("fails a different result, a missing refusal and a missing method", async () => {
    await expect(
      runConnectorCase(restShelf, {
        ...CASE,
        steps: [RESTOCK, { method: "stock", args: ["TEE"], result: 6 }],
        exchanges: CASE.exchanges.slice(0, 2),
      }),
    ).rejects.toThrow(/"restock", step 2 \(stock\): the result differs/);
    await expect(
      runConnectorCase(restShelf, {
        ...CASE,
        steps: [{ method: "stock", args: ["TEE"], refusal: { status: 404 } }],
        exchanges: [READ],
      }),
    ).rejects.toThrow(/was not refused/);
    await expect(
      runConnectorCase(restShelf, {
        ...CASE,
        steps: [{ method: "archive", args: ["TEE"] }],
        exchanges: [],
      }),
    ).rejects.toThrow(/has no such method/);
  });

  it("fails when a recorded call is never made", async () => {
    await expect(
      runConnectorCase(restShelf, { ...CASE, steps: CASE.steps.slice(0, 1) }),
    ).rejects.toThrow(/was not finished/);
  });
});
