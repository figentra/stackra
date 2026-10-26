/**
 * Stackra file contract:
 * Purpose: unit tests of `DynamicClient`: a registered key and route is called and queued through the injected
 *          transport with the call options (the scope included), the answer comes back undecoded, a query is never
 *          queued, and the key is never registered as a generated ref.
 * Boundary: test only; a stand-in transport, so nothing reaches a network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (the 2026-10-26 note on dynamic keys).
 */
import { kindOf } from "@stackra/container";
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { DynamicClient } from "#core/clients/dynamic.client";
import { CALL_REFS } from "#core/constants/call-refs.constant";

/** Records every request and answers each call with an unvalidated body. */
class RecordingTransport extends ClientTransport {
  readonly sent: ClientRequest[] = [];

  readonly queued: ClientRequest[] = [];

  send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return Promise.resolve({ accepted: 2, extra: true });
  }

  queue(request: ClientRequest): Promise<void> {
    this.queued.push(request);
    return Promise.resolve();
  }
}

const importRows = {
  key: "orders.order.import_rows@1",
  kind: "action",
  endpoint: { method: HttpMethod.Post, path: "/orders/import-rows" },
} as const;

describe("DynamicClient", () => {
  it("is a service, so it is its own token", () => {
    expect(kindOf(DynamicClient)?.kind).toBe("service");
  });

  it("calls a registered key with the scope and resolves the answer as it came", async () => {
    const transport = new RecordingTransport();
    const answer = await new DynamicClient(transport).call(
      importRows,
      { rows: [{ sku: "a" }] },
      { scope: "platform.acme", idempotencyKey: "step-1" },
    );
    expect(answer).toEqual({ accepted: 2, extra: true });
    expect(transport.sent[0]).toMatchObject({
      key: "orders.order.import_rows@1",
      kind: "action",
      endpoint: importRows.endpoint,
      input: { rows: [{ sku: "a" }] },
      scope: "platform.acme",
      idempotencyKey: "step-1",
    });
    expect(CALL_REFS.has("orders.order.import_rows@1")).toBe(false);
  });

  it("queues an action and refuses to queue a query", async () => {
    const transport = new RecordingTransport();
    const client = new DynamicClient(transport);
    await client.queue(importRows, { rows: [] });
    expect(transport.queued[0]?.key).toBe("orders.order.import_rows@1");
    await expect(client.queue({ key: "orders.order.list@1", kind: "query" }, {})).rejects.toThrow(
      TypeError,
    );
  });
});
