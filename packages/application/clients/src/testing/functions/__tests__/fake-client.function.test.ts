/**
 * Stackra file contract:
 * Purpose: unit and type tests of `fakeClient`: the setup scripts the fake, and the fake overrides a service's generated
 *          client in a testing module (typed as that client) and answers its members there.
 * Boundary: test only; the module restates the template's `createTestingModule(...).override(PricingClient, ...)`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (fakes); ADR 0260 (decision 10); ADR 0263.
 */
import { Module, Service } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { ServiceClient } from "#core/bases/service-client.base";
import { remoteQuery } from "#core/functions/remote-query.function";
import { ClientFake } from "#testing/client.fake";
import { fakeClient } from "#testing/functions/fake-client.function";

const QuotePriceQuery = remoteQuery("pricing.price.quote@1", {
  input: z.object({ market: z.string() }),
  output: z.object({ currency: z.string() }),
  endpoint: { method: HttpMethod.Post, path: "/prices/quote" },
});

class PricingClient extends ServiceClient {
  readonly price = { quote: this.member(QuotePriceQuery) };
}

/** A consumer of the pricing client. */
class OrderPricingService extends Service {
  readonly pricing: PricingClient;

  constructor(pricing: PricingClient) {
    super();
    this.pricing = pricing;
  }
}

class OrdersModule extends Module({}) {}

describe("fakeClient", () => {
  it("returns a fake scripted by the setup", async () => {
    const pricing = fakeClient((fake) => fake.on(QuotePriceQuery).returns({ currency: "SAR" }));
    expect(pricing).toBeInstanceOf(ClientFake);
    expect(pricing.knows(QuotePriceQuery.key)).toBe(true);
    expectTypeOf(pricing).toExtend<ClientFake>();
  });

  it("overrides a generated client, typed as that client", async () => {
    // Type-checks only because the fake takes the overridden client's type from where it is passed.
    const app = await createTestingModule(OrdersModule)
      .override(PricingClient, fakeClient())
      .compile();
    expect(app).toBeDefined();
    expectTypeOf(fakeClient<PricingClient>()).not.toBeNever();
    expectTypeOf(fakeClient<PricingClient>()).toExtend<PricingClient>();
  });

  it("answers the members of the client it stands in for", async () => {
    const pricing = fakeClient<PricingClient>((fake) =>
      fake.on(QuotePriceQuery).returns({ currency: "SAR" }),
    );
    const consumer = new OrderPricingService(pricing);
    expect(await consumer.pricing.price.quote.call({ market: "sa" })).toEqual({ currency: "SAR" });
    expect(pricing.called(QuotePriceQuery)).toEqual([{ market: "sa" }]);
  });
});
