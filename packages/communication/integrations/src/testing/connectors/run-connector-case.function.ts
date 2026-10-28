/**
 * Stackra file contract:
 * Purpose: `runConnectorCase(make, recorded)`, the recorded-case runner of any connector driver (a marketplace, a 3PL,
 *          a product feed, an ad platform): it builds the driver over a replay of the case's recording, calls each step
 *          in order, checks its result or its refusal, and checks every recorded call was made.
 * Boundary: names no vendor and checks only what the case states; the request shapes are what the recording pins
 *           (`replayIntegrationApi`). Throws a `TypeError` naming the case and the step on the first difference, so it
 *           runs under any test runner. `./testing` only (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decisions 7 and 8); owner D3 and D4 2026-10-27; STA-793.
 */
import { isDeepStrictEqual } from "node:util";

import { ProviderRefusedError } from "#core/index";
import type { IntegrationApi } from "#core/index";
import { replayIntegrationApi } from "#testing/accounting/replay-integration-api.function";
import type { ConnectorCase } from "#testing/connectors/connector-case.type";

/**
 * Runs one recorded case against the driver `make` builds.
 *
 * @param make - builds the driver over the managed client it is given (the Connection's `api` in production).
 * @returns each step's result, in order (undefined for a refused step).
 * @throws TypeError naming the case and the step that differs, or the recorded call never made.
 * @example
 * await runConnectorCase((api) => new ShopChannel(api), acknowledgeCase);
 */
export async function runConnectorCase<C>(
  make: (api: IntegrationApi) => C,
  recorded: ConnectorCase<C>,
): Promise<readonly unknown[]> {
  const api = replayIntegrationApi(recorded.name, recorded.exchanges);
  const driver = make(api);
  const results: unknown[] = [];
  for (const [index, step] of recorded.steps.entries()) {
    const where = `Connector case "${recorded.name}", step ${index + 1} (${step.method})`;
    const method: unknown = (driver as Record<string, unknown>)[step.method];
    if (typeof method !== "function")
      throw new TypeError(`${where}: the driver has no such method`);
    let result: unknown;
    try {
      result = (await Reflect.apply(method, driver, step.args as readonly unknown[])) as unknown;
    } catch (error) {
      if (step.refusal !== undefined && ProviderRefusedError.is(error, step.refusal)) {
        results.push(undefined);
        continue;
      }
      throw error;
    }
    if (step.refusal !== undefined) throw new TypeError(`${where}: was not refused`);
    if (step.result !== undefined && !isDeepStrictEqual(result, step.result))
      throw new TypeError(`${where}: the result differs from the recording`);
    results.push(result);
  }
  api.done();
  return results;
}
