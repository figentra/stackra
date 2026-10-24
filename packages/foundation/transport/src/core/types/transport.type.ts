/**
 * Stackra file contract:
 * Purpose: `Transport`, one HTTP exchange: a standard `Request` in, a standard `Response` out. It is both what
 *          `createTransport` returns and the terminal fetch it wraps (`globalThis.fetch`, `nativeFetch`).
 * Boundary: a type only; the platform's own `Request` and `Response`, never a wrapper, so any fetch fits.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (clients call through the transport); ADR 0142 (transport behind drivers).
 */

/**
 * Sends one request.
 *
 * @example
 * const send: Transport = createTransport({ middleware: [timeout(Duration.seconds(30))] });
 * const response = await send(new Request(url));
 */
export type Transport = (request: Request) => Promise<Response>;
