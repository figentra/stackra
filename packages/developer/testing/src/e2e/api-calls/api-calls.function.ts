/**
 * Stackra file contract:
 * Purpose: `apiCalls(key)`, the answered requests of the current test that called the endpoint of one consumed key
 *          (`orders.order.create@1`), service-worker replays included: a journey asserts how often a write reached the
 *          server and with which headers.
 * Boundary: synchronous; reads what `test`'s recorder logged in this test and the manifests under the project's
 *           `testDir` (the member root `e2ePreset` sets). A context the test opened itself is not recorded.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0252 (a queued write replays once).
 */
import { test } from "@playwright/test";

import type { ApiCall } from "#e2e/api-calls/api-call.type";
import { API_CALL_LOG } from "#e2e/api-calls/api-call-log.constant";
import { endpointOf } from "#e2e/api-calls/endpoint-of.function";
import { matchesEndpoint } from "#e2e/api-calls/matches-endpoint.function";

/**
 * The calls of `key` so far in this test.
 *
 * @throws RangeError when the app consumes no endpoint keyed `key`.
 * @example
 * expect(apiCalls("orders.order.create@1")).toHaveLength(1);
 */
export function apiCalls(key: string): ApiCall[] {
  const endpoint = endpointOf(test.info().project.testDir, key);
  return API_CALL_LOG.filter((call) => matchesEndpoint(call, endpoint));
}
