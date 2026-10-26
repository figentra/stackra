/**
 * Stackra file contract:
 * Purpose: `ProviderResolver`, the one rule of ADR 0356 for every multi-provider capability (SMS, WhatsApp, voice,
 *          mail, geocoding, accounting): the tenant's own Connection of a provider the Market offers wins; without
 *          one, the Market's platform Connection serves; a stored record reloads the exact Connection that served it.
 *          `candidates` answers the whole ordered failover list with own-or-managed per entry; `resolve` the first.
 * Boundary: a service with three dependencies: the `ConnectionStore` (which applies the caller's scope and decrypts
 *           credentials), `ProviderDefaults` (market-pack data: the providers a Market offers, in order) and
 *           `MarketContext` (the running call's Market, used when the caller passes none). It names no Market and no
 *           provider. A provider code with no driver in the caller's map is skipped, and a provider listed twice
 *           counts once. With no Market, only the tenant's own Connections are tried, in the map's order. Whether an
 *           own Connection may fail over to a managed one is the caller's policy, read from the modes. `@Replaces`
 *           stays global and is never used for this (ADR 0356 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 1 to 5 and 7); ADR 0308 (rule 9); ADR 0355 (decision 1); ADR 0422
 *                     (decision 3).
 */
import { Service } from "@stackra/container";

import { ProviderMode } from "#contracts/enums/provider-mode.enum";
import type { MarketContext } from "#contracts/ports/market-context.port";
import type { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import type { CredentialRef } from "#contracts/types/credential-ref.type";
import type { Connection } from "#core/bases/connection.base";
import { NoProviderError } from "#core/errors/no-provider.error";
import { credentialRef } from "#core/functions/credential-ref.function";
import type { ConnectionStore } from "#core/ports/connection-store.port";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ProviderCandidate } from "#core/types/provider-candidate.type";
import type { ProviderDrivers } from "#core/types/provider-drivers.type";

/**
 * Picks the Connection that serves a call.
 *
 * @example
 * const sms = await resolver.resolve("sms", SMS_CONNECTIONS);
 * await sms.sendSms(message, key);
 *
 * for (const { connection, mode } of await resolver.candidates("sms", SMS_CONNECTIONS, { market: "sa" })) { … }
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
   * The Connection that serves `capability`: the first of `candidates`.
   *
   * @param drivers - the caller's connection class per provider code.
   * @param accepts - whether a Connection can serve this call (a capability flag); every one when left out.
   * @param market - the Market to resolve for; the running call's (`MarketContext`) when left out.
   * @throws NoProviderError when neither the tenant nor the Market has one that is accepted.
   */
  async resolve<T>(
    capability: string,
    drivers: ProviderDrivers<T>,
    accepts: (connection: Connection & T) => boolean = () => true,
    market?: string,
  ): Promise<Connection & T> {
    const named = market ?? this.markets.market();
    // The walk is lazy, so the first accepted Connection ends it and no later platform Connection is loaded.
    const first = await this.walk(capability, drivers, named, accepts).next();
    if (first.done !== true) return first.value.connection;
    throw NoProviderError.create({ capability, ...(named === undefined ? {} : { market: named }) });
  }

  /**
   * Every Connection that can serve `capability`, in the order to try: the tenant's own Connections of the providers
   * the Market offers (mode `own`), then the Market's platform Connections (mode `managed`), each in the Market's
   * order. Empty when none is accepted.
   *
   * @param drivers - the caller's connection class per provider code.
   * @param options - `market` to resolve for (the running call's when left out) and `accepts`, the capability flag.
   */
  async candidates<T>(
    capability: string,
    drivers: ProviderDrivers<T>,
    options: {
      readonly market?: string;
      readonly accepts?: (connection: Connection & T) => boolean;
    } = {},
  ): Promise<readonly ProviderCandidate<T>[]> {
    const out: ProviderCandidate<T>[] = [];
    const market = options.market ?? this.markets.market();
    for await (const candidate of this.walk(
      capability,
      drivers,
      market,
      options.accepts ?? (() => true),
    ))
      out.push(candidate);
    return out;
  }

  /**
   * Yields the accepted candidates in order: own first, then managed, each in the Market's order.
   *
   * @yields Each accepted candidate, own drivers first.
   */
  private async *walk<T>(
    capability: string,
    drivers: ProviderDrivers<T>,
    market: string | undefined,
    accepts: (connection: Connection & T) => boolean,
  ): AsyncGenerator<ProviderCandidate<T>> {
    const choices: readonly { readonly provider: string; readonly connectionId?: string }[] =
      market === undefined
        ? Object.keys(drivers).map((provider) => ({ provider }))
        : await this.defaults.providers(capability, market);
    const offered = choices.flatMap((choice, index) => {
      const type = Object.hasOwn(drivers, choice.provider) ? drivers[choice.provider] : undefined;
      const repeated = choices.findIndex((other) => other.provider === choice.provider) !== index;
      return type === undefined || repeated ? [] : [{ choice, type }];
    });
    for (const { choice, type } of offered) {
      // oxlint-disable-next-line no-await-in-loop -- one lookup per offered provider, in the Market's order
      const own = await this.store.find(type);
      if (own !== null && accepts(own))
        yield { provider: choice.provider, connection: own, mode: ProviderMode.Own };
    }
    for (const { choice, type } of offered) {
      if (choice.connectionId === undefined) continue;
      // oxlint-disable-next-line no-await-in-loop -- one load per platform Connection, in the Market's order
      const platform = await this.store.byId(type, choice.connectionId);
      if (accepts(platform))
        yield { provider: choice.provider, connection: platform, mode: ProviderMode.Managed };
    }
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
