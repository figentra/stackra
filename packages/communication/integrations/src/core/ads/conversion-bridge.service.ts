/**
 * Stackra file contract:
 * Purpose: `ConversionBridge`, the server side of ad conversions: a listener of an integration event (`order.placed`)
 *          hands it here with its `Conversion`, and the bridge builds the `ConversionEvent` and sends it through
 *          `ConnectorGateway.ads()` to the ad platform Connection.
 * Boundary: a service over `ConnectorGateway` and `conversionOf`; it names no vendor (vendor Connections are OS
 *           integrations, ADR 0443 decision 7). A listener subscribes by its event type, so a host writes one small
 *           `Listener` per relayed event and keeps the mapping as data. Without marketing consent nothing is sent and
 *           the answer is `null`. A platform's refusal of the conversion is in the `AdBatchResult`; a failed call
 *           rejects, and the listener's retry sends again (the platform dedups by `eventId`).
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 5); ADR 0472 (decision 4); ADR 0447 (decision 2); ADR 0078 (decision
 *                     4: listener semantics); analytics gap 12 (stackra-412).
 */
import { Service } from "@stackra/container";

import type { AdBatchResult } from "#contracts/ads/ad-batch-result.type";
import { conversionConsentOf } from "#core/ads/conversion-consent-of.function";
import { conversionOf } from "#core/ads/conversion-of.function";
import type { Conversion } from "#core/ads/conversion.type";
import type { ConnectorGateway } from "#core/services/connector-gateway.service";

/**
 * Relays integration events to an ad platform's conversions API.
 *
 * @example
 * export class PurchaseConversionListener extends Listener({ queue: Queues.Default }) {
 *   async handle(event: OrderPlaced, ctx: ListenerContext): Promise<void> {
 *     await this.bridge.relay(PURCHASE, event, ctx.occurredAt);
 *   }
 * }
 */
export class ConversionBridge extends Service {
  /** Finds the ad platform Connection. */
  private readonly gateway: ConnectorGateway;

  /**
   * @param gateway - the connector gateway bound in the host.
   */
  constructor(gateway: ConnectorGateway) {
    super();
    this.gateway = gateway;
  }

  /**
   * Sends the conversion `payload` makes under `conversion`; `null` when its consent did not grant marketing.
   *
   * @param at - when the fact happened (the listener context's `occurredAt`).
   * @throws TypeError when the payload has no dedup id or nothing to match the person by.
   * @throws NoProviderError when no ad platform Connection serves.
   */
  async relay(conversion: Conversion, payload: unknown, at: Date): Promise<AdBatchResult | null> {
    // Consent is read before the Connection is resolved, so a refused visitor needs no ad platform at all.
    if (conversionConsentOf(conversion, payload) === null) return null;
    const platform = await this.gateway.ads(
      conversion.provider === undefined ? {} : { provider: conversion.provider },
    );
    const event = await conversionOf(conversion, payload, at, platform.phoneFormat ?? "e164");
    return event === null ? null : platform.sendConversions([event]);
  }
}
