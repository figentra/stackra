/**
 * Stackra file contract:
 * Purpose: `CLIENTS_TESTING_PLUGIN`, the testing-module plugin of @stackra/clients: a `memory` candidate of the
 *          `ClientTransport` port, which is `ClientFake`, so a test that compiles with `.useDrivers("memory")` gets every
 *          generated client over a fake that records calls and answers from the test's script.
 * Boundary: a test-only candidate: it joins the port's table only when the test picks `memory` for it, so a
 *           production wiring never lists it. Registered on import of `./testing` (gen's Vitest setup imports it for a
 *           member on @stackra/clients). Holds no state; each compiled app builds its own fake. A test that overrides a
 *           generated client (`.override(StockClient, fakeClient(...))`) still wins over this transport.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: testing plugins); ADR 0266 (memory first); ADR 0260 (decision 6: the
 *                     transport is a driver); STA-1297.
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingPlugin } from "@stackra/container/testing";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { ClientFake } from "#testing/client.fake";

/** The clients testing-module plugin. */
export const CLIENTS_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/clients",
  drivers: [
    {
      port: ClientTransport,
      key: "clients.ClientTransport",
      candidates: { memory: () => Promise.resolve(ClientFake) },
    },
  ],
};

registerTestingPlugin(CLIENTS_TESTING_PLUGIN);
