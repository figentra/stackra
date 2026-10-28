/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientFake`: scripted answers by ref (a value, a function of the decoded input, a one-time
 *          rejection before a lasting answer, a pending call), recorded calls and queued calls, an unanswered call, and
 *          the stand-in for a service client's member paths.
 * Boundary: test only; the refs restate the template's generated `services/commerce` clients.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (fakes); ADR 0260 (decision 10).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import { ServiceClient } from "#core/bases/service-client.base";
import { TransportError } from "#core/errors/transport.error";
import { clientRequest } from "#core/functions/client-request.function";
import { remoteAction } from "#core/functions/remote-action.function";
import { remoteQuery } from "#core/functions/remote-query.function";
import { ClientFake } from "#testing/client.fake";

const QuotePriceQuery = remoteQuery("pricing.price.quote@1", {
  input: z.object({ lines: z.array(z.object({ quantity: z.number().int() })) }),
  output: z.object({
    lines: z.array(z.object({ quantity: z.number(), unitPriceMinor: z.number() })),
  }),
  endpoint: { method: HttpMethod.Post, path: "/prices/quote" },
});

const VoidPaymentAction = remoteAction("payments.payment.void@1", {
  input: z.object({ paymentId: z.string() }),
  output: z.object({ paymentId: z.string() }),
});

const GetVariantByBarcodeQuery = remoteQuery("catalogue.variant.get_by_barcode@1", {
  input: z.object({ barcode: z.string() }),
  output: z.object({ variantId: z.string() }),
});

class PricingClient extends ServiceClient {
  readonly price = { quote: this.member(QuotePriceQuery) };
}

describe("ClientFake", () => {
  it("is a client transport", () => {
    expect(new ClientFake()).toBeInstanceOf(ClientTransport);
  });

  it("answers a ref with a value or with a function of the decoded input", async () => {
    const fake = new ClientFake();
    fake.on(GetVariantByBarcodeQuery).returns({ variantId: "var_1" });
    fake.on(QuotePriceQuery).returns(({ lines }) => ({
      lines: lines.map((line) => ({ ...line, unitPriceMinor: 1000 })),
    }));
    expect(await fake.send(clientRequest(GetVariantByBarcodeQuery, { barcode: "1" }))).toEqual({
      variantId: "var_1",
    });
    expect(await fake.send(clientRequest(QuotePriceQuery, { lines: [{ quantity: 2 }] }))).toEqual({
      lines: [{ quantity: 2, unitPriceMinor: 1000 }],
    });
    expect(fake.knows(QuotePriceQuery.key)).toBe(true);
    expect(fake.knows(VoidPaymentAction.key)).toBe(false);
  });

  it("rejects once before its lasting answer, and can stay pending", async () => {
    const fake = new ClientFake();
    const offline = TransportError.create({ reason: TransportFailure.Network });
    fake.on(GetVariantByBarcodeQuery).throwsOnce(offline).returns({ variantId: "var_1" });
    const request = clientRequest(GetVariantByBarcodeQuery, { barcode: "1" });
    await expect(fake.send(request)).rejects.toBe(offline);
    expect(await fake.send(request)).toEqual({ variantId: "var_1" });
    fake.on(QuotePriceQuery).pending();
    const settled = await Promise.race([
      fake.send(clientRequest(QuotePriceQuery, { lines: [] })).then(() => "settled"),
      new Promise((resolve) => {
        setTimeout(() => resolve("waiting"), 10);
      }),
    ]);
    expect(settled).toBe("waiting");
  });

  it("records calls and queued calls by ref, and rejects a call it has no answer for", async () => {
    const fake = new ClientFake();
    await fake.queue(clientRequest(VoidPaymentAction, { paymentId: "pay_1" }));
    await expect(
      fake.send(clientRequest(GetVariantByBarcodeQuery, { barcode: "9" })),
    ).rejects.toThrow(/no answer for catalogue\.variant\.get_by_barcode@1/);
    expect(fake.queued(VoidPaymentAction)).toEqual([{ paymentId: "pay_1" }]);
    expect(fake.called(GetVariantByBarcodeQuery)).toEqual([{ barcode: "9" }]);
    expect(fake.called(VoidPaymentAction)).toEqual([]);
  });

  it("stands in for a service client's members", async () => {
    const fake = new ClientFake();
    fake.on(QuotePriceQuery).returns({ lines: [] });
    const pricing = fake as unknown as PricingClient;
    expect(await pricing.price.quote.call({ lines: [] })).toEqual({ lines: [] });
    const payments = fake as unknown as {
      payment: { void: { queue(input: object): Promise<void> } };
    };
    await payments.payment.void.queue({ paymentId: "pay_2" });
    expect(fake.queued(VoidPaymentAction)).toEqual([{ paymentId: "pay_2" }]);
    expect(fake.called(QuotePriceQuery)).toEqual([{ lines: [] }]);
  });
});
