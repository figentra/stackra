/**
 * Stackra file contract:
 * Purpose: `ConnectorQuery<T>`, what a `ConnectorGateway` lookup takes: the provider to use, a filter on the
 *          Connection and the Market to resolve for.
 * Boundary: a type only; every field is optional, so an empty query is the ADR 0356 pick for the running call.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 2); ADR 0356 (decisions 1 and 2).
 */
import type { Connection } from "#core/bases/connection.base";

/**
 * A connector lookup.
 *
 * @example
 * const query: ConnectorQuery<SalesChannelConnector> = { provider: "talabat", accepts: (c) => c.setMenu !== undefined };
 */
export interface ConnectorQuery<T> {
  /** The provider code; the resolver's pick when left out. */
  readonly provider?: string;

  /** Whether a Connection can serve this call (an optional method it has, a flag); every one when left out. */
  readonly accepts?: (connection: Connection & T) => boolean;

  /** The Market to resolve for; the running call's when left out. */
  readonly market?: string;
}
