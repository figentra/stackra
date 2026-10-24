/**
 * Stackra file contract:
 * Purpose: `IntegrationEventOptions`, what `IntegrationEvent({...})` takes: the short name written once, the version,
 *          whether tenants may subscribe an outbound webhook to it, and its broadcast.
 * Boundary: a type only. The kind registry records the options with their defaults applied (`version: 1`,
 *           `webhook: false`, broadcast audience principal); gen locks the wire name `<module>.<name>.v<version>` in
 *           `stackra.manifest.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0294 (decision 16; amendment item 7); ADR 0224 (webhooks).
 */
import type { BroadcastOptions } from "#core/types/broadcast-options.type";

/** The options of an integration event. */
export interface IntegrationEventOptions {
  /** The short name, dotted snake_case (`order.paid`); gen adds the module key and the version. */
  readonly name: string;

  /** The version, a whole number from 1; a breaking change raises it and adds a `Change` class beside the event. */
  readonly version?: number;

  /** Whether `@stackra/webhooks` may deliver it, signed, to the endpoints a tenant registers. */
  readonly webhook?: boolean;

  /** A data-free refresh to the sessions that hold the permission. */
  readonly broadcast?: BroadcastOptions;
}
