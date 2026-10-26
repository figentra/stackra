/**
 * Stackra file contract:
 * Purpose: `API_CALL_LOG`, the requests the current test's browser context sent and got an answer to: `test`'s
 *          recorder fills it, `apiCalls(key)` reads it.
 * Boundary: internal to `./e2e` (not exported). Worker-process state, emptied when each test starts; a request that
 *           failed (offline) is not in it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6).
 */
import type { ApiCall } from "#e2e/api-calls/api-call.type";

/**
 * The answered requests of the running test, in the order they finished.
 *
 * @example
 * API_CALL_LOG.filter((call) => call.method === "POST");
 */
export const API_CALL_LOG: ApiCall[] = [];
