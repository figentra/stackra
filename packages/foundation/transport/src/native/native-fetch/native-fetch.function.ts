/**
 * Stackra file contract:
 * Purpose: `nativeFetch`, the terminal fetch of a transport on Expo: sends the request through `expo/fetch`, whose
 *          response body streams, so `readNdjson` and `readServerSentEvents` work on iOS and Android, where React
 *          Native's own fetch buffers the whole body.
 * Boundary: turns the platform `Request` into `expo/fetch`'s `(url, init)` call: method, headers, signal and, for a
 *           method that may carry one, the body read as bytes (a multipart body keeps its boundary through the copied
 *           `Content-Type`). The Expo response has the `Response` members the pipeline reads (`status`, `ok`,
 *           `headers`, `body`, `json`, `text`), so it is returned as one. Expo only: `expo` is an optional peer.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15: the `./native` entry); ADR 0165 (Expo is the mobile stack).
 */
import { fetch as expoFetch } from "expo/fetch";

import type { Transport } from "#core/types/transport.type";

/** Methods that never carry a body. */
const BODILESS = new Set(["GET", "HEAD"]);

/**
 * Sends one request through `expo/fetch`.
 *
 * @example
 * const send = createTransport({ fetch: nativeFetch, middleware: [bearerToken(session.token)] });
 */
export const nativeFetch: Transport = async (request) => {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, name) => {
    headers[name] = value;
  });
  const bytes = BODILESS.has(request.method.toUpperCase())
    ? undefined
    : await request.arrayBuffer();
  const response = await expoFetch(request.url, {
    method: request.method,
    headers,
    signal: request.signal,
    ...(bytes === undefined || bytes.byteLength === 0 ? {} : { body: bytes }),
  });
  // The Expo response is structurally the platform one; React Native's `Response` cannot wrap a stream body.
  return response as unknown as Response;
};
