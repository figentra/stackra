/**
 * Stackra file contract:
 * Purpose: `ConnectionPaymentGatewaysDriver`, the `PaymentGateways` of ADR 0356: for a Market it walks the providers
 *          the Market offers (market-pack data, in order), takes the tenant's own Connection of the first provider
 *          that has every capability the call needs, and otherwise that Market's platform Connection; for a stored
 *          payment it reloads the exact connection that served it.
 * Boundary: the driver named `connection`. It reads Connections only through `ConnectionStore` (the store applies the
 *           tenant scope and decrypts credentials) and never names a Market or a provider: both come from
 *           `MarketPaymentDefaults`. A provider code this package has no connection class for is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 5); ADR 0357 (decision 2); ADR 0308 (rule 9).
 */
import { Driver } from "@stackra/container";
import type { Connection, ConnectionClass, ConnectionStore } from "@stackra/integrations";

import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import { PAYMENT_CONNECTIONS } from "#core/constants/payment-connections.constant";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";

/** A payments connection class. */
type GatewayClass = ConnectionClass<Connection & PaymentGateway>;

/** The connection class of `provider`, or undefined for a code this package has no driver for. */
const classOf = (provider: string): GatewayClass | undefined =>
  Object.hasOwn(PAYMENT_CONNECTIONS, provider) ? PAYMENT_CONNECTIONS[provider] : undefined;

/** Whether `gateway` has every capability in `needs`. */
const serves = (gateway: PaymentGateway, needs: readonly PaymentCapability[]): boolean =>
  needs.every((need) => gateway.capabilities.includes(need));

/**
 * Tenant Connection first, then the Market default.
 *
 * @example
 * const gateway = await gateways.forMarket(market, [PaymentCapability.Checkout]);
 */
export class ConnectionPaymentGatewaysDriver extends Driver(PaymentGateways) {
  /** Where Connections are found. */
  private readonly store: ConnectionStore;

  /** The Market's providers and platform Connections, from data. */
  private readonly defaults: MarketPaymentDefaults;

  /**
   * @param store - the integrations connection store bound in the host.
   * @param defaults - the market-pack answer of which providers a Market offers.
   */
  constructor(store: ConnectionStore, defaults: MarketPaymentDefaults) {
    super();
    this.store = store;
    this.defaults = defaults;
  }

  async forMarket(market: string, needs: readonly PaymentCapability[]): Promise<PaymentGateway> {
    const offered = (await this.defaults.providers(market)).flatMap((choice) => {
      const type = classOf(choice.provider);
      return type === undefined ? [] : [{ choice, type }];
    });
    for (const { type } of offered) {
      const own = await this.store.find(type);
      if (own !== null && serves(own, needs)) return own;
    }
    for (const { choice, type } of offered) {
      const platform = await this.store.byId(type, choice.connectionId);
      if (serves(platform, needs)) return platform;
    }
    throw NoPaymentProviderError.create({ market, needs: needs.join(",") });
  }

  async byConnection(provider: string, connectionId: string): Promise<PaymentGateway> {
    const type = classOf(provider);
    if (type === undefined) throw NoPaymentProviderError.create({ provider });
    return this.store.byId(type, connectionId);
  }
}
