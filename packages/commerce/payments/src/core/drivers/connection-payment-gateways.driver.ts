/**
 * Stackra file contract:
 * Purpose: `ConnectionPaymentGatewaysDriver`, the `PaymentGateways` of ADR 0356: for a Market it walks the providers
 *          the Market offers (market-pack data, in order), takes the tenant's own Connection of the first provider
 *          that has every capability the call needs, and otherwise that Market's platform Connection (a provider with
 *          none is bring-your-own only, so only a tenant's own Connection serves it); for a stored
 *          payment it reloads the exact connection that served it.
 * Boundary: the driver named `connection`. It reads Connections only through `ConnectionStore` (the store applies the
 *           tenant scope and decrypts credentials) and never names a Market or a provider: both come from
 *           `MarketPaymentDefaults`. The connection class per provider code (`drivers`) is every registered
 *           Connection of the `payments` category, from whichever installed package ships it (the OS vendor
 *           Connections, owner decision R3-8), so a payments service binds this driver as it is (STA-1703); a host may
 *           still subclass it with its own map. Credentials resolve through the bound `ConnectionStore` (its `hosted`
 *           driver keeps them in the integrations service). The constructor takes class tokens only (ADR 0294 rule 17). A provider code with no class in the map is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 5); ADR 0357 (decision 2); ADR 0308 (rule 9); owner decision R3-8
 *                     (vendor drivers in OS integrations, STA-1281).
 */
import { Driver } from "@stackra/container";
import { connectionsOf, IntegrationCategory } from "@stackra/integrations";
import type {
  Connection,
  ConnectionClass,
  ConnectionStore,
  ProviderDrivers,
} from "@stackra/integrations";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";
import { TerminalConnectionRequiredError } from "#core/errors/terminal-connection-required.error";

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
 *   protected override readonly drivers = PAYMENT_CONNECTIONS;
 * }
 * const gateway = await gateways.forMarket(market, [PaymentCapability.Checkout]);
 */
export class ConnectionPaymentGatewaysDriver extends Driver(PaymentGateways) {
  /** The host's connection class per provider code (each key its Integration's `provider`), declared by its subclass. */
  protected readonly drivers: ProviderDrivers<PaymentGateway> = connectionsOf<PaymentGateway>(
    IntegrationCategory.Payments,
  );

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

  /**
   * Connection `connectionId` when given, else the own Connection that serves `needs` first, else the Market's
   * platform one. A terminal call with no `connectionId` is refused when more than one Connection serves it, since a
   * terminal id belongs to one provider (STA-1718).
   */
  async forMarket(
    market: string,
    needs: readonly PaymentCapability[],
    connectionId?: string,
  ): Promise<PaymentGateway> {
    // Only a named Connection or a terminal needs every serving Connection; any other call takes the first.
    const all = connectionId !== undefined || needs.includes(PaymentCapability.Terminal);
    const serving = await this.serving(market, needs, all);
    const found =
      connectionId === undefined
        ? serving[0]
        : serving.find((gateway) => gateway.id === connectionId);
    if (found === undefined)
      throw NoPaymentProviderError.create({ market, needs: needs.join(",") });
    if (
      connectionId === undefined &&
      needs.includes(PaymentCapability.Terminal) &&
      serving.length > 1
    )
      throw TerminalConnectionRequiredError.create({
        market,
        connections: serving.map((gateway) => gateway.id).join(","),
      });
    return found;
  }

  /** The gateway of Connection `connectionId` of `provider`. */
  async byConnection(provider: string, connectionId: string): Promise<PaymentGateway> {
    const type = this.classOf(provider);
    if (type === undefined) throw NoPaymentProviderError.create({ provider });
    return this.store.byId(type, connectionId);
  }

  /**
   * The Connections of the Market that serve `needs`, the tenant's own first, then the platform's, in Market order:
   * every one when `all`, else the first only.
   */
  private async serving(
    market: string,
    needs: readonly PaymentCapability[],
    all: boolean,
  ): Promise<PaymentGateway[]> {
    const offered = (await this.defaults.providers(market)).flatMap((choice) => {
      const type = this.classOf(choice.provider);
      return type === undefined ? [] : [{ choice, type }];
    });
    const found: PaymentGateway[] = [];
    for (const { type } of offered) {
      // oxlint-disable-next-line no-await-in-loop -- one lookup per offered provider, in the Market's order
      const own = await this.store.find(type);
      if (own !== null && serves(own, needs)) found.push(own);
      if (!all && found.length > 0) return found;
    }
    for (const { choice, type } of offered) {
      if (choice.connectionId === undefined) continue;
      // oxlint-disable-next-line no-await-in-loop -- one lookup per offered provider, in the Market's order
      const platform = await this.store.byId(type, choice.connectionId);
      if (serves(platform, needs) && !found.some((gateway) => gateway.id === platform.id))
        found.push(platform);
      if (!all && found.length > 0) return found;
    }
    return found;
  }

  /** The connection class of `provider`, or undefined for a code the host has no driver for. */
  private classOf(provider: string): GatewayClass | undefined {
    return Object.hasOwn(this.drivers, provider) ? this.drivers[provider] : undefined;
  }
}
