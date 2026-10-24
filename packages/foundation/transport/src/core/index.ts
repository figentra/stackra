/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/transport, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `withHeader`, `readLines` and the method and status sets stay
 *           internal. `nativeFetch` is exported from `./native` only (ADR 0294 decision 15: one symbol, one entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";
export { RequestTimedOutError } from "#core/errors/request-timed-out.error";
export { bearerToken } from "#core/functions/bearer-token.function";
export { createTransport } from "#core/functions/create-transport.function";
export { idempotencyKey } from "#core/functions/idempotency-key.function";
export { readNdjson } from "#core/functions/read-ndjson.function";
export { readServerSentEvents } from "#core/functions/read-server-sent-events.function";
export { retry } from "#core/functions/retry.function";
export { stackraVersion } from "#core/functions/stackra-version.function";
export { timeout } from "#core/functions/timeout.function";
export type { Middleware } from "#core/types/middleware.type";
export type { RetryOptions } from "#core/types/retry-options.type";
export type { ServerSentEvent } from "#core/types/server-sent-event.type";
export type { TokenSource } from "#core/types/token-source.type";
export type { Transport } from "#core/types/transport.type";
export type { TransportOptions } from "#core/types/transport-options.type";
