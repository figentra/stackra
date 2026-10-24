/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ServiceClient`: a generated client's members call and queue through the injected
 *          transport with the call options, validate the input first, and only an action's member can queue.
 * Boundary: test only; the clients restate the template's generated `services/commerce` pricing and payments clients,
 *           over a stand-in transport.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decisions 3, 4 and 6).
 */
import { kindOf } from "@stackra/container";
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { ServiceClient } from "#core/bases/service-client.base";
import { remoteAction } from "#core/functions/remote-action.function";
import { remoteQuery } from "#core/functions/remote-query.function";

const QuotePriceQuery = remoteQuery("pricing.price.quote@1", {
  input: z.object({ market: z.string() }),
  output: z.object({ currency: z.string() }),
  endpoint: { method: HttpMethod.Post, path: "/prices/quote" },
});

const VoidPaymentAction = remoteAction("payments.payment.void@1", {
  input: z.object({ paymentId: z.string() }),
  output: z.object({ paymentId: z.string() }),
});

/** Records every request and answers each call with `answer`. */
class RecordingTransport extends ClientTransport {
  readonly sent: ClientRequest[] = [];

  readonly queued: ClientRequest[] = [];

  send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return Promise.resolve({ currency: "SAR" });
  }

  queue(request: ClientRequest): Promise<void> {
    this.queued.push(request);
    return Promise.resolve();
  }
}

class PricingClient extends ServiceClient {
  readonly price = { quote: this.member(QuotePriceQuery) };
}

class PaymentsClient extends ServiceClient {
  readonly payment = { void: this.member(VoidPaymentAction) };
}

describe("ServiceClient", () => {
  it("is a service, so the client is its own token", () => {
    expect(kindOf(PricingClient)?.kind).toBe("service");
  });

  it("calls a query through the transport", async () => {
    const transport = new RecordingTransport();
    const quote = await new PricingClient(transport).price.quote.call({ market: "sa" });
    expect(quote).toEqual({ currency: "SAR" });
    expect(transport.sent[0]).toMatchObject({
      key: "pricing.price.quote@1",
      input: { market: "sa" },
    });
  });

  it("queues an action with the call options", async () => {
    const transport = new RecordingTransport();
    await new PaymentsClient(transport).payment.void.queue(
      { paymentId: "pay_1" },
      { idempotencyKey: "undo-1", onBehalfOf: "usr_1" },
    );
    expect(transport.queued[0]).toMatchObject({
      key: "payments.payment.void@1",
      input: { paymentId: "pay_1" },
      idempotencyKey: "undo-1",
      onBehalfOf: "usr_1",
    });
  });

  it("refuses an invalid input before the transport runs", async () => {
    const transport = new RecordingTransport();
    await expect(
      new PricingClient(transport).price.quote.call({ market: 1 } as never),
    ).rejects.toThrow();
    expect(transport.sent).toEqual([]);
  });

  it("types the members: a query calls, an action also queues", () => {
    const client = new PaymentsClient(new RecordingTransport());
    expectTypeOf(client.payment.void.queue).toBeFunction();
    expectTypeOf(new PricingClient(new RecordingTransport()).price.quote).not.toHaveProperty(
      "queue",
    );
    expectTypeOf(client.payment.void.call).returns.resolves.toEqualTypeOf<{ paymentId: string }>();
  });
});
