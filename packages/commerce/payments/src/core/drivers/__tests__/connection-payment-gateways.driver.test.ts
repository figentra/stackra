/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionPaymentGatewaysDriver`: the tenant's own Connection wins when it has every
 *          capability, the Market's platform Connection serves otherwise, a provider without the capability or
 *          without a driver is skipped, and a stored connection is reloaded by id.
 * Boundary: test only; a minimal `ConnectionStore` over `makeConnection` stands in for the store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decisions 2 and 3).
 */
import { refusal } from "@stackra/errors/testing";
import { ConnectionStore } from "@stackra/integrations";
import type { Connection, ConnectionClass } from "@stackra/integrations";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { ConnectionPaymentGatewaysDriver } from "#core/drivers/connection-payment-gateways.driver";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";
import { FawryConnection } from "#core/providers/fawry/fawry.connection";
import { FawryIntegration } from "#core/providers/fawry/fawry.integration";
import { StripeConnection } from "#core/providers/stripe/stripe.connection";
import { StripeIntegration } from "#core/providers/stripe/stripe.integration";
import { MarketPaymentDefaultsFake } from "#testing/market-payment-defaults.fake";

const stripeOwn = makeConnection(StripeConnection, {
  id: "conn_00000000000000000000000001",
  api: fakeIntegrationApi(StripeIntegration, () => undefined),
  fields: { secretKey: "sk_test_tenant" },
});
const stripePlatform = makeConnection(StripeConnection, {
  id: "conn_00000000000000000000000002",
  api: fakeIntegrationApi(StripeIntegration, () => undefined),
  fields: { secretKey: "sk_test_platform" },
});
const fawryPlatform = makeConnection(FawryConnection, {
  id: "conn_00000000000000000000000003",
  api: fakeIntegrationApi(FawryIntegration, () => undefined),
  fields: { merchantCode: "m", secureKey: "k" },
});

/** A store whose tenant holds `own` and whose platform holds the rest. */
class TestStore extends ConnectionStore {
  private readonly own: readonly Connection[];

  constructor(own: readonly Connection[]) {
    super();
    this.own = own;
  }

  async find<C extends Connection>(type: ConnectionClass<C>): Promise<C | null> {
    return (this.own.find((connection) => connection instanceof type) as C | undefined) ?? null;
  }

  async byId<C extends Connection>(_type: ConnectionClass<C>, id: string): Promise<C> {
    const found = [stripeOwn, stripePlatform, fawryPlatform].find((c) => c.id === id);
    if (found === undefined) throw new TypeError(`no connection ${id}`);
    return found as unknown as C;
  }

  async list(): Promise<never[]> {
    return [];
  }

  async connect(): Promise<never> {
    throw new TypeError("not in this test");
  }

  async disconnect(): Promise<void> {}
}

const defaults = MarketPaymentDefaultsFake.with({
  m1: [
    { provider: "fawry", connectionId: fawryPlatform.id },
    { provider: "unknown-provider", connectionId: "conn_x" },
    { provider: "stripe", connectionId: stripePlatform.id },
  ],
});

describe("ConnectionPaymentGatewaysDriver", () => {
  it("takes the tenant's own Connection when it serves the call", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([stripeOwn]), defaults);
    expect(await gateways.forMarket("m1", [PaymentCapability.Capture])).toBe(stripeOwn);
  });

  it("falls back to the Market's platform Connection in Market order", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([]), defaults);
    expect(await gateways.forMarket("m1", [PaymentCapability.Checkout])).toBe(fawryPlatform);
    expect(await gateways.forMarket("m1", [PaymentCapability.Capture])).toBe(stripePlatform);
  });

  it("refuses a Market with no provider that serves the call", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([]), defaults);
    await expect(gateways.forMarket("m2", [PaymentCapability.Checkout])).rejects.toRefuseWith(
      refusal(NoPaymentProviderError, { market: "m2", needs: "checkout" }),
    );
  });

  it("reloads the connection that served a payment", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([]), defaults);
    expect(await gateways.byConnection("stripe", stripePlatform.id)).toBe(stripePlatform);
    await expect(gateways.byConnection("nope", "conn_1")).rejects.toRefuseWith(
      refusal(NoPaymentProviderError, { provider: "nope" }),
    );
  });
});
