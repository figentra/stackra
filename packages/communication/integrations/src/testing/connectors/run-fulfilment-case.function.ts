/**
 * Stackra file contract:
 * Purpose: `runFulfilmentCase(make, recorded)`, the recorded-case runner every fulfilment-provider (3PL, WMS) driver
 *          passes: it hands the case's order over twice (both must return the recorded fulfilment, so the second
 *          found the first), then runs the case's further steps, over a replay of its recording.
 * Boundary: `runConnectorCase` with the repeat hand-over put first; names no vendor. `./testing` only (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0355 (decision 1); ADR 0447 (decision 2); ADR 0443 (decision 8); owner D3 and D4
 *                     2026-10-27; COM-113; STA-793.
 */
import type { FulfilmentProviderConnector } from "#contracts/index";
import type { IntegrationApi } from "#core/index";
import type { FulfilmentCase } from "#testing/connectors/fulfilment-case.type";
import { runConnectorCase } from "#testing/connectors/run-connector-case.function";

/**
 * Runs one recorded fulfilment case against the driver `make` builds.
 *
 * @param make - builds the driver over the managed client it is given.
 * @returns each step's result, the two hand-overs first.
 * @throws TypeError naming the case and the step that differs, or the recorded call never made.
 * @example
 * await runFulfilmentCase((api) => new WarehouseFulfilment(api), handOver);
 */
export async function runFulfilmentCase(
  make: (api: IntegrationApi) => FulfilmentProviderConnector,
  recorded: FulfilmentCase,
): Promise<readonly unknown[]> {
  const create = {
    method: "create",
    args: [recorded.request],
    result: recorded.fulfilment,
  } as const;
  return runConnectorCase(make, { ...recorded, steps: [create, create, ...recorded.steps] });
}
