/**
 * Stackra file contract:
 * Purpose: `ConnectionPaymentGatewaysDriver`, the `PaymentGateways` of ADR 0356: for a Market it walks the providers
 *          the Market offers (market-pack data, in order), takes the tenant's own Connection of the first provider
 *          that has every capability the call needs, and otherwise that Market's platform Connection (a provider with
 *          none is bring-your-own only, so only a tenant's own Connection serves it); for a stored
 *          payment it reloads the exact connection that served it.
 * Boundary: the driver named `connection`. It reads Connections only through `ConnectionStore` (the store applies the
 *           tenant scope and decrypts credentials) and never names a Market or a provider: both come from
 *           `MarketPaymentDefaults`. The connection class per provider code is the host's (`drivers`): the vendor
 *           Integrations live in the OS integrations service (owner decision R3-8), so the host subclasses this driver
 *           and passes its map. A provider code with no class in the map is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 5); ADR 0357 (decision 2); ADR 0308 (rule 9); owner decision R3-8
 *                     (vendor drivers in OS integrations, STA-1281).
 */
import { Driver } from "@stackra/container";
import type {
  Connection,
  ConnectionClass,
  ConnectionStore,
  ProviderDrivers,
} from "@stackra/integrations";

import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";

/** A payments connection class. */
type GatewayClass = ConnectionClass<Connection & PaymentGateway>;

/** Whether `gateway` has every capability in `needs`. */
const serves = (gateway: PaymentGateway, needs: readonly PaymentCapability[]): boolean =>
  needs.every((need) => gateway.capabilities.includes(need));

/**
 * Tenant Connection first, then the Market default.
 *
 * @example
 * // the host's driver, over the vendor connection classes it owns
 * export class OsPaymentGatewaysDriver extends ConnectionPaymentGatewaysDriver {
 *   constructor(store: ConnectionStore, defaults: MarketPaymentDefaults) {
 *     super(store, defaults, PAYMENT_CONNECTIONS);
 *   }
 * }
 * const gateway = await gateways.forMarket(market, [PaymentCapability.Checkout]);
 */
export class ConnectionPaymentGatewaysDriver extends Driver(PaymentGateways) {
  /** Where Connections are found. */
  private readonly store: ConnectionStore;

  /** The Market's providers and platform Connections, from data. */
  private readonly defaults: MarketPaymentDefaults;

  /** The host's connection class per provider code. */
  private readonly drivers: ProviderDrivers<PaymentGateway>;

  /**
   * @param store - the integrations connection store bound in the host.
   * @param defaults - the market-pack answer of which providers a Market offers.
   * @param drivers - the host's connection class per provider code (each key its Integration's `provider`).
   */
  constructor(
    store: ConnectionStore,
    defaults: MarketPaymentDefaults,
    drivers: ProviderDrivers<PaymentGateway>,
  ) {
    super();
    this.store = store;
    this.defaults = defaults;
    this.drivers = drivers;
  }

  /** The connection class of `provider`, or undefined for a code the host has no driver for. */
  private classOf(provider: string): GatewayClass | undefined {
    return Object.hasOwn(this.drivers, provider) ? this.drivers[provider] : undefined;
  }

  async forMarket(market: string, needs: readonly PaymentCapability[]): Promise<PaymentGateway> {
    const offered = (await this.defaults.providers(market)).flatMap((choice) => {
      const type = this.classOf(choice.provider);
      return type === undefined ? [] : [{ choice, type }];
    });
    for (const { type } of offered) {
      const own = await this.store.find(type);
      if (own !== null && serves(own, needs)) return own;
    }
    for (const { choice, type } of offered) {
      if (choice.connectionId === undefined) continue;
      const platform = await this.store.byId(type, choice.connectionId);
      if (serves(platform, needs)) return platform;
    }
    throw NoPaymentProviderError.create({ market, needs: needs.join(",") });
  }

  async byConnection(provider: string, connectionId: string): Promise<PaymentGateway> {
    const type = this.classOf(provider);
    if (type === undefined) throw NoPaymentProviderError.create({ provider });
    return this.store.byId(type, connectionId);
  }
}
