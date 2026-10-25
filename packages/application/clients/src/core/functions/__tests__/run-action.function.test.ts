/**
 * Stackra file contract:
 * Purpose: unit tests of `runAction`: a sent call resolves its answer and invalidates the queries it changes; a network
 *          failure queues an action the queue may hold (behind the record its route names) and rethrows for an
 *          online-only one; a refusal is never queued; an invalid input sends nothing.
 * Boundary: test only; the transport and the queue are stand-ins, so nothing reaches a network or storage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0059 (offline queue); ADR 0260 (decision 4).
 */
import { HttpMethod } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { MutationQueue, OfflineError } from "@stackra/query";
import { describe, expect, it } from "@stackra/testing";
import { QueryClient } from "@tanstack/query-core";
import { vi } from "vitest";
import { z } from "zod";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { TransportError } from "#core/errors/transport.error";
import { actionRef } from "#core/functions/action-ref.function";
import { queryRef } from "#core/functions/query-ref.function";
import { refusalRef } from "#core/functions/refusal-ref.function";
import { runAction } from "#core/functions/run-action.function";

class CancelOrderAction extends actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ status: z.string() }),
  http: { method: HttpMethod.Put, path: "/orders/:orderId/cancel" },
}) {}

class GetOrderQuery extends queryRef("orders.order.get@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ status: z.string() }),
}) {}

class OrderNotPayableError extends refusalRef("orders.order_not_payable") {}

/** A transport that answers every call with `answer`. */
class StubTransport extends ClientTransport {
  readonly sent: ClientRequest[] = [];

  private readonly answer: () => Promise<unknown>;

  constructor(answer: () => Promise<unknown>) {
    super();
    this.answer = answer;
  }

  send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return this.answer();
  }

  queue(): Promise<void> {
    return Promise.resolve();
  }
}

/** A mutation queue whose `enqueue` is `enqueue`. */
function queueWith(enqueue: MutationQueue["enqueue"]): MutationQueue {
  return Object.assign(Object.create(MutationQueue.prototype) as MutationQueue, { enqueue });
}

const offline = () => Promise.reject(TransportError.create({ reason: TransportFailure.Network }));

describe("runAction", () => {
  it("sends the call, resolves its answer and invalidates the queries it changes", async () => {
    const transport = new StubTransport(() => Promise.resolve({ status: "cancelled" }));
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const result = await runAction(
      { transport, client, invalidates: [GetOrderQuery] },
      CancelOrderAction,
      { orderId: "ord_1" },
    );
    expect(result).toEqual({ queued: false, data: { status: "cancelled" } });
    expect(transport.sent[0]?.key).toBe("orders.order.cancel@1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders.order.get@1"] });
  });

  it("queues an action the queue may hold when the network is down", async () => {
    const enqueue = vi.fn<MutationQueue["enqueue"]>().mockResolvedValue({} as never);
    const result = await runAction(
      { transport: new StubTransport(offline), queue: queueWith(enqueue) },
      CancelOrderAction,
      { orderId: "ord_1" },
    );
    expect(result).toEqual({ queued: true });
    expect(enqueue).toHaveBeenCalledWith(CancelOrderAction, { orderId: "ord_1" }, "ord_1");
  });

  it("rethrows the network error for an online-only action", async () => {
    const enqueue = vi
      .fn<MutationQueue["enqueue"]>()
      .mockRejectedValue(OfflineError.create({ action: CancelOrderAction.key }));
    const run = runAction(
      { transport: new StubTransport(offline), queue: queueWith(enqueue) },
      CancelOrderAction,
      { orderId: "ord_1" },
    );
    await expect(run).rejects.toSatisfy((error) => isRefusal(error, TransportError));
  });

  it("never queues a refusal", async () => {
    const enqueue = vi.fn<MutationQueue["enqueue"]>();
    const run = runAction(
      {
        transport: new StubTransport(() => Promise.reject(refusal(OrderNotPayableError))),
        queue: queueWith(enqueue),
      },
      CancelOrderAction,
      { orderId: "ord_1" },
    );
    await expect(run).rejects.toSatisfy((error) => isRefusal(error, OrderNotPayableError));
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("sends nothing for an invalid input", async () => {
    const transport = new StubTransport(() => Promise.resolve({}));
    await expect(
      runAction({ transport }, CancelOrderAction, { orderId: 1 } as never),
    ).rejects.toThrow();
    expect(transport.sent).toEqual([]);
  });
});
