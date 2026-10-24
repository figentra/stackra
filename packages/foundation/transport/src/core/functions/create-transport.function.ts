/**
 * Stackra file contract:
 * Purpose: `createTransport`, the pipeline: folds the middleware, outermost first, over the terminal fetch.
 * Boundary: holds no state of its own; every middleware is a pure function of the request and `next`. Without a
 *           `fetch` option the global `fetch` is read on every send, so a test stub or a later polyfill is used.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (clients call through the transport); ADR 0142 (transport behind drivers).
 */
import type { Transport } from "#core/types/transport.type";
import type { TransportOptions } from "#core/types/transport-options.type";

/**
 * Builds a transport.
 *
 * @example
 * const send = createTransport({
 *   middleware: [
 *     stackraVersion(apiVersion),
 *     bearerToken(() => session.accessToken),
 *     idempotencyKey(),
 *     retry({ attempts: 2 }),
 *     timeout(Duration.seconds(30)),
 *   ],
 * });
 * const response = await send(new Request(`${baseUrl}/orders`, { method: "POST", body }));
 */
export function createTransport(options: TransportOptions = {}): Transport {
  const terminal: Transport = options.fetch ?? ((request) => globalThis.fetch(request));
  return (options.middleware ?? []).reduceRight<Transport>(
    (next, middleware) => (request) => middleware(request, next),
    terminal,
  );
}
