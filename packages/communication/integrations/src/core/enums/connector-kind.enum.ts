/**
 * Stackra file contract:
 * Purpose: `ConnectorKind`, the commerce connector kinds an Integration with the connector role may declare: a carrier,
 *          a fulfilment provider, a sales channel (a marketplace or another shop) and a product feed.
 * Boundary: an `Enum.of` value plus the type of the same name. Each kind names the interface its Connection implements:
 *           `CarrierGateway` of `@stackra/shipping`, and `FulfilmentProviderConnector`, `SalesChannelConnector` and
 *           `ProductFeedConnector` of `./contracts`. Which connectors a Market lists is data (`connector-catalogue`).
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 6); ADR 0218 (decision 3); COM-147, COM-301; COM-296.
 */
import { Enum } from "@stackra/contracts";

/**
 * The connector kinds.
 *
 * @example
 * Integration({ provider: "noon", roles: [IntegrationRole.Connector], connectors: [ConnectorKind.SalesChannel], ... });
 */
export const ConnectorKind = Enum.of({
  /** Rates, labels, pickups and tracking (`CarrierGateway`, `@stackra/shipping`). */
  Carrier: "carrier",
  /** A third party that picks, packs and ships our orders (`FulfilmentProviderConnector`). */
  FulfilmentProvider: "fulfilment_provider",
  /** A marketplace or shop whose orders we import and whose stock and prices we push (`SalesChannelConnector`). */
  SalesChannel: "sales_channel",
  /** A catalogue we publish our products to (`ProductFeedConnector`). */
  ProductFeed: "product_feed",
});

/** One of the codes above. */
export type ConnectorKind = Enum.Value<typeof ConnectorKind>;
