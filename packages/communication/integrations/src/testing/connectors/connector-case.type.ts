/**
 * Stackra file contract:
 * Purpose: `ConnectorCase<C>`, one recorded case a connector driver must pass: the steps called on the driver, in
 *          order, and the provider's recorded calls they make, with the case's certification state. One shape serves
 *          every connector contract (`SalesChannelConnector`, `ProductFeedConnector`, `AdPlatformConnector`, …).
 * Boundary: a type only. An OS connector ships its cases beside its driver; `certification: "pending"` marks a
 *           recording built from the provider's public API documentation (owner D3 and D4, 2026-10-27), `"sandbox"` one
 *           captured from a sandbox run. No credential, token or real person's data goes in a case.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decisions 7 and 8); owner D3 2026-10-27; STA-793.
 */
import type { RecordedExchange } from "#testing/accounting/recorded-exchange.type";
import type { ConnectorStep } from "#testing/connectors/connector-step.type";

/**
 * A recorded connector case.
 *
 * @example
 * const ack: ConnectorCase<SalesChannelConnector> = { name: "acknowledge", certification: "pending", steps: [{ method: "acknowledge", args: ["ORD-1"] }], exchanges: [{ method: "POST", path: "/orders/ORD-1/ack" }] };
 */
export interface ConnectorCase<C> {
  /** What the case covers, named in a failure. */
  readonly name: string;

  /** `pending` until the recording is replaced by a sandbox capture. */
  readonly certification: "pending" | "sandbox";

  /** The calls made on the driver, in order. */
  readonly steps: readonly ConnectorStep<C>[];

  /** The calls the driver makes to the provider, in order. */
  readonly exchanges: readonly RecordedExchange[];
}
