/**
 * Stackra file contract:
 * Purpose: `memoryTransport`, the `ClientFake` a compiled testing app bound as its `ClientTransport` under
 *          `.useDrivers("memory")`, so a test scripts and reads every generated client's calls in one place.
 * Boundary: reads the app only. Throws when the app's transport is not the memory candidate (the test did not pick
 *           `memory`, or overrode the transport), naming the fix.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); ADR 0260 (decision 6); STA-1297.
 */
import type { TestingApp } from "@stackra/container/testing";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { ClientFake } from "#testing/client.fake";

/**
 * The memory transport of `app`.
 *
 * @throws Error when the app's `ClientTransport` is not a `ClientFake`.
 * @example
 * const app = await createTestingModule(SalesModule).useDrivers("memory").compile();
 * memoryTransport(app).on(ListAvailableStockQuery).returns({ items: [] });
 */
export function memoryTransport(app: Pick<TestingApp, "get">): ClientFake {
  const transport = app.get(ClientTransport);
  if (!(transport instanceof ClientFake))
    throw new Error(
      'The app\'s ClientTransport is not the memory driver: compile with .useDrivers("memory") and do not override ClientTransport',
    );
  return transport;
}
