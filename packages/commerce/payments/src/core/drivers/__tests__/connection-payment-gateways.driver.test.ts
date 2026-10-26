/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionPaymentGatewaysDriver`: the tenant's own Connection wins when it has every
 *          capability, the Market's platform Connection serves otherwise, a provider without the capability or
 *          without a driver is skipped, and a stored connection is reloaded by id.
 * Boundary: test only; a minimal `ConnectionStore` and two test connection classes stand in for the store and the
 *           host's vendor map (the vendor Connections live in the OS integrations service).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decisions 2 and 3).
 */
import { refusal } from "@stackra/errors/testing";
import { ConnectedAccount, Connection, ConnectionStore } from "@stackra/integrations";
import type { ConnectionClass, ProviderDrivers } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import { ConnectionPaymentGatewaysDriver } from "#core/drivers/connection-payment-gateways.driver";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";
import { MarketPaymentDefaultsFake } from "#testing/market-payment-defaults.fake";

/** A gateway connection that only declares its capabilities; the vendor ones live in OS integrations. */
abstract class Gateway extends Connection {
  abstract readonly capabilities: readonly PaymentCapability[];
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "test" });
  }
}
/** Checkout and capture. */
class CardConnection extends Gateway {
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture];
  }
}
/** Checkout only. */
class VoucherConnection extends Gateway {
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout];
  }
}

/** The host's map, as the OS integrations service passes it. */
const DRIVERS = {
  card: CardConnection,
  voucher: VoucherConnection,
} as unknown as ProviderDrivers<PaymentGateway>;

/** A bare instance of `type`; the driver reads only its class and capabilities. */
const instance = <C extends Gateway>(type: { readonly prototype: C }): C =>
  Object.create(type.prototype) as C;
const cardOwn = instance(CardConnection);
const cardPlatform = instance(CardConnection);
const voucherPlatform = instance(VoucherConnection);
const PLATFORM = new Map<string, Connection>([
  ["conn_00000000000000000000000002", cardPlatform],
  ["conn_00000000000000000000000003", voucherPlatform],
]);

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
    const found = PLATFORM.get(id);
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
    { provider: "voucher", connectionId: "conn_00000000000000000000000003" },
    { provider: "unknown-provider", connectionId: "conn_x" },
    { provider: "card", connectionId: "conn_00000000000000000000000002" },
  ],
});

describe("ConnectionPaymentGatewaysDriver", () => {
  it("takes the tenant's own Connection when it serves the call", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(
      new TestStore([cardOwn]),
      defaults,
      DRIVERS,
    );
    expect(await gateways.forMarket("m1", [PaymentCapability.Capture])).toBe(cardOwn);
  });

  it("falls back to the Market's platform Connection in Market order", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([]), defaults, DRIVERS);
    expect(await gateways.forMarket("m1", [PaymentCapability.Checkout])).toBe(voucherPlatform);
    expect(await gateways.forMarket("m1", [PaymentCapability.Capture])).toBe(cardPlatform);
  });

  it("refuses a Market with no provider that serves the call", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([]), defaults, DRIVERS);
    await expect(gateways.forMarket("m2", [PaymentCapability.Checkout])).rejects.toRefuseWith(
      refusal(NoPaymentProviderError, { market: "m2", needs: "checkout" }),
    );
  });

  it("serves a bring-your-own-only provider from the tenant's Connection and never from a platform one", async () => {
    const byo = MarketPaymentDefaultsFake.with({ m3: [{ provider: "card" }] });
    const own = new ConnectionPaymentGatewaysDriver(new TestStore([cardOwn]), byo, DRIVERS);
    expect(await own.forMarket("m3", [PaymentCapability.Checkout])).toBe(cardOwn);
    const none = new ConnectionPaymentGatewaysDriver(new TestStore([]), byo, DRIVERS);
    await expect(none.forMarket("m3", [PaymentCapability.Checkout])).rejects.toRefuseWith(
      refusal(NoPaymentProviderError, { market: "m3", needs: "checkout" }),
    );
  });

  it("reloads the connection that served a payment", async () => {
    const gateways = new ConnectionPaymentGatewaysDriver(new TestStore([]), defaults, DRIVERS);
    expect(await gateways.byConnection("card", "conn_00000000000000000000000002")).toBe(
      cardPlatform,
    );
    await expect(gateways.byConnection("nope", "conn_1")).rejects.toRefuseWith(
      refusal(NoPaymentProviderError, { provider: "nope" }),
    );
  });
});
