/**
 * Stackra file contract:
 * Purpose: `TransportOptions`, what `createTransport` takes: the middleware in order and the terminal fetch.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (clients call through the transport).
 */
import type { Middleware } from "#core/types/middleware.type";
import type { Transport } from "#core/types/transport.type";

/** The pipeline of one transport. */
export interface TransportOptions {
  /** Outermost first: the first middleware sees the request first and the response last. */
  readonly middleware?: readonly Middleware[];

  /** The terminal fetch; the global `fetch`, read on every send, when left out. `nativeFetch` on Expo. */
  readonly fetch?: Transport;
}
