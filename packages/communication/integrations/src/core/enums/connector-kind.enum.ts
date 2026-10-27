/**
 * Stackra file contract:
 * Purpose: `ConnectorKind`, the connector kinds an Integration with the connector role may declare: a carrier, a
 *          fulfilment provider, a sales channel (a marketplace, a delivery app or another shop), a product feed, an EDI
 *          network, a fraud scorer, a document store and an ad platform.
 * Boundary: an `Enum.of` value plus the type of the same name. Each kind names the interface its Connection implements:
 *           `CarrierGateway` of `@stackra/shipping`, and `FulfilmentProviderConnector`, `SalesChannelConnector`,
 *           `ProductFeedConnector`, `EdiConnector`, `FraudScoringConnector`, `DocumentStoreConnector` and
 *           `AdPlatformConnector` of
 *           `./contracts`. A kind is a capability `connectionsOf` looks up; it is not a sixth `IntegrationRole`.
 *           Which connectors a Market lists is data (`connector-catalogue`).
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 6); ADR 0218 (decision 3); ADR 0447 (decisions 2 to 5); COM-147,
 *                     COM-301; COM-296; R3-SO-07; STA-793 (ad platform).
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
  /** Purchase orders in; order responses, despatch advice and invoices out, through an EDI network (`EdiConnector`). */
  Edi: "edi",
  /** Scores an order or a payment for fraud (`FraudScoringConnector`). */
  FraudScoring: "fraud_scoring",
  /** A document management system we list, fetch and file documents in (`DocumentStoreConnector`). */
  DocumentStore: "document_store",
  /** Server-side conversions and customer audiences of an ad platform (`AdPlatformConnector`). */
  AdPlatform: "ad_platform",
});

/** One of the codes above. */
export type ConnectorKind = Enum.Value<typeof ConnectorKind>;
