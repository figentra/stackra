/**
 * Stackra file contract:
 * Purpose: `ON_BEHALF_OF_TOKEN`, the user's access token the running call may forward in `Stackra-On-Behalf-Of`, held
 *          for that one call: what `ServiceClientSessionDriver` reads when the call makes a service-to-service call.
 * Boundary: internal; an `AsyncLocalStorage` that only `holdCallerToken` enters, so the token follows the call through
 *           every await and never reaches a concurrent one or outlives it (a singleton driver cannot hold a
 *           `Lifetime.Request` service, so the request lifetime is this store's run). The store is a reader, not the
 *           token: nothing enumerates, serialises or logs it, and `holdCallerToken` empties it when the call ends.
 * Runtime: node
 * Governing contract: ADR 0209 (2026-11-07 amendment, conditions 4 and 5: never logged or stored, one hop by default).
 */
import { AsyncLocalStorage } from "node:async_hooks";

/** Reads the running call's forwardable token; undefined when it has none or the call has ended. */
export const ON_BEHALF_OF_TOKEN = new AsyncLocalStorage<() => string | undefined>();
