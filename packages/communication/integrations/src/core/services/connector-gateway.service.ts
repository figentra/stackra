/**
 * Stackra file contract:
 * Purpose: `ConnectorGateway`, the one place a module gets the Connection of a connector kind: the fulfilment provider
 *          (3PL, WMS), the sales channel, the product feed, the EDI network, the fraud scorer or the document store,
 *          for one provider when the caller names it (a channel order reloads its own channel), otherwise the one
 *          ADR 0356 picks for the tenant and Market.
 * Boundary: a service over `ProviderResolver` and `connectionsOf`; it adds no rule of its own. The capability passed
 *           to the resolver is the kind's code, so a Market's provider list is pack data under
 *           `providers.<kind>` (`providers.fulfilment_provider`). A named provider with no registered Connection is a
 *           `NoProviderError`, as the resolver refuses one; `accepts` narrows by an optional method
 *           (`(channel) => channel.setMenu !== undefined`). It names no provider and no Market.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decisions 2 and 3); ADR 0356 (decisions 1 and 2); ADR 0355 (decisions 1 and 6);
 *                     STA-904; COM-147; COM-301.
 */
import { Service } from "@stackra/container";

import type { DocumentStoreConnector } from "#contracts/types/document-store-connector.type";
import type { EdiConnector } from "#contracts/types/edi-connector.type";
import type { FraudScoringConnector } from "#contracts/types/fraud-scoring-connector.type";
import type { FulfilmentProviderConnector } from "#contracts/types/fulfilment-provider-connector.type";
import type { ProductFeedConnector } from "#contracts/types/product-feed-connector.type";
import type { SalesChannelConnector } from "#contracts/types/sales-channel-connector.type";
import type { Connection } from "#core/bases/connection.base";
import { ConnectorKind } from "#core/enums/connector-kind.enum";
import { NoProviderError } from "#core/errors/no-provider.error";
import { connectionsOf } from "#core/functions/connections-of.function";
import type { ProviderResolver } from "#core/services/provider-resolver.service";
import type { ConnectorQuery } from "#core/types/connector-query.type";

/**
 * Resolves connector Connections.
 *
 * @example
 * const threePl = await gateway.fulfilment({ provider: "shipbob" });
 * await threePl.create(request);
 *
 * const app = await gateway.channel({ provider: order.channel, accepts: (c) => c.setPrepTime !== undefined });
 */
export class ConnectorGateway extends Service {
  /** The ADR 0356 resolver. */
  private readonly resolver: ProviderResolver;

  /**
   * @param resolver - the provider resolver bound in the host.
   */
  constructor(resolver: ProviderResolver) {
    super();
    this.resolver = resolver;
  }

  /**
   * A fulfilment provider (3PL or WMS).
   *
   * @throws NoProviderError when none serves.
   */
  async fulfilment(
    query: ConnectorQuery<FulfilmentProviderConnector> = {},
  ): Promise<Connection & FulfilmentProviderConnector> {
    return this.of(ConnectorKind.FulfilmentProvider, query);
  }

  /**
   * A sales channel (a marketplace, a delivery app or another shop).
   *
   * @throws NoProviderError when none serves.
   */
  async channel(
    query: ConnectorQuery<SalesChannelConnector> = {},
  ): Promise<Connection & SalesChannelConnector> {
    return this.of(ConnectorKind.SalesChannel, query);
  }

  /**
   * A product feed.
   *
   * @throws NoProviderError when none serves.
   */
  async feed(
    query: ConnectorQuery<ProductFeedConnector> = {},
  ): Promise<Connection & ProductFeedConnector> {
    return this.of(ConnectorKind.ProductFeed, query);
  }

  /**
   * An EDI network.
   *
   * @throws NoProviderError when none serves.
   */
  async edi(query: ConnectorQuery<EdiConnector> = {}): Promise<Connection & EdiConnector> {
    return this.of(ConnectorKind.Edi, query);
  }

  /**
   * A fraud scorer.
   *
   * @throws NoProviderError when none serves.
   */
  async fraud(
    query: ConnectorQuery<FraudScoringConnector> = {},
  ): Promise<Connection & FraudScoringConnector> {
    return this.of(ConnectorKind.FraudScoring, query);
  }

  /**
   * A document store.
   *
   * @throws NoProviderError when none serves.
   */
  async documents(
    query: ConnectorQuery<DocumentStoreConnector> = {},
  ): Promise<Connection & DocumentStoreConnector> {
    return this.of(ConnectorKind.DocumentStore, query);
  }

  /** The Connection of `kind`, narrowed to `query.provider` when given. */
  private async of<T>(kind: ConnectorKind, query: ConnectorQuery<T>): Promise<Connection & T> {
    const drivers = connectionsOf<T>(kind);
    const { provider } = query;
    if (provider !== undefined && !Object.hasOwn(drivers, provider))
      throw NoProviderError.create({ capability: kind, provider });
    const narrowed =
      provider === undefined
        ? drivers
        : { [provider]: drivers[provider] as (typeof drivers)[string] };
    return this.resolver.resolve<T>(kind, narrowed, query.accepts, query.market);
  }
}
