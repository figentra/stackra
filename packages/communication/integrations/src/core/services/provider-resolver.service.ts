/**
 * Stackra file contract:
 * Purpose: `ProviderResolver`, the one rule of ADR 0356 for every multi-provider capability (SMS, WhatsApp, voice,
 *          mail, geocoding, accounting): the tenant's own Connection of a provider the Market offers wins; without
 *          one, the Market's platform Connection serves; a stored record reloads the exact Connection that served it.
 * Boundary: a service with three dependencies: the `ConnectionStore` (which applies the caller's scope and decrypts
 *           credentials), `ProviderDefaults` (market-pack data: the providers a Market offers, in order) and
 *           `MarketContext` (the running call's Market). It names no Market and no provider. A provider code with no
 *           driver in the caller's map is skipped. With no Market, only the tenant's own Connections are tried, in the
 *           map's order. `@Replaces` stays global and is never used for this (ADR 0356 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 1 to 5); ADR 0308 (rule 9); ADR 0355 (decision 1).
 */
import { Service } from "@stackra/container";

import type { MarketContext } from "#contracts/ports/market-context.port";
import type { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import type { CredentialRef } from "#contracts/types/credential-ref.type";
import type { Connection } from "#core/bases/connection.base";
import { NoProviderError } from "#core/errors/no-provider.error";
import { credentialRef } from "#core/functions/credential-ref.function";
import type { ConnectionStore } from "#core/ports/connection-store.port";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ProviderDrivers } from "#core/types/provider-drivers.type";

/**
 * Picks the Connection that serves a call.
 *
 * @example
 * const sms = await resolver.resolve("sms", SMS_CONNECTIONS);
 * await sms.sendSms(message, key);
 */
export class ProviderResolver extends Service {
  /** Where Connections are found. */
  private readonly store: ConnectionStore;

  /** The Market's providers, from data. */
  private readonly defaults: ProviderDefaults;

  /** The running call's Market. */
  private readonly markets: MarketContext;

  /**
   * @param store - the connection store bound in the host.
   * @param defaults - the market-pack answer of which providers a Market offers.
   * @param markets - the running call's Market.
   */
  constructor(store: ConnectionStore, defaults: ProviderDefaults, markets: MarketContext) {
    super();
    this.store = store;
    this.defaults = defaults;
    this.markets = markets;
  }

  /**
   * The Connection that serves `capability` for the running call.
   *
   * @param drivers - the caller's connection class per provider code.
   * @param accepts - whether a Connection can serve this call (a capability flag); every one when left out.
   * @throws NoProviderError when neither the tenant nor the Market has one that is accepted.
   */
  async resolve<T>(
    capability: string,
    drivers: ProviderDrivers<T>,
    accepts: (connection: Connection & T) => boolean = () => true,
  ): Promise<Connection & T> {
    const market = this.markets.market();
    const choices: readonly { readonly provider: string; readonly connectionId?: string }[] =
      market === undefined
        ? Object.keys(drivers).map((provider) => ({ provider }))
        : await this.defaults.providers(capability, market);
    const offered = choices.flatMap((choice) => {
      const type = Object.hasOwn(drivers, choice.provider) ? drivers[choice.provider] : undefined;
      return type === undefined ? [] : [{ choice, type }];
    });
    for (const { type } of offered) {
      const own = await this.store.find(type);
      if (own !== null && accepts(own)) return own;
    }
    for (const { choice, type } of offered) {
      if (choice.connectionId === undefined) continue;
      const platform = await this.store.byId(type, choice.connectionId);
      if (accepts(platform)) return platform;
    }
    throw NoProviderError.create({ capability, ...(market === undefined ? {} : { market }) });
  }

  /**
   * The Connection `connectionId` of `provider`: the one that served an earlier call, so a follow-up (a refund, a
   * status check, a hang-up) reaches the same account.
   *
   * @throws NoProviderError when `provider` has no driver in `drivers`.
   */
  async byConnection<T>(
    drivers: ProviderDrivers<T>,
    provider: string,
    connectionId: string,
  ): Promise<Connection & T> {
    const type: ConnectionClass<Connection & T> | undefined = Object.hasOwn(drivers, provider)
      ? drivers[provider]
      : undefined;
    if (type === undefined) throw NoProviderError.create({ provider });
    return this.store.byId(type, connectionId);
  }

  /**
   * The Connection a stored `CredentialRef` names (a credential held in the integrations vault).
   *
   * @throws TypeError when `ref` is malformed; NoProviderError when its provider has no driver in `drivers`.
   */
  async byRef<T>(drivers: ProviderDrivers<T>, ref: CredentialRef): Promise<Connection & T> {
    const { provider, connectionId } = credentialRef.parse(ref);
    return this.byConnection(drivers, provider, connectionId);
  }
}
