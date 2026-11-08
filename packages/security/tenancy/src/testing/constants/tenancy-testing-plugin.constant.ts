/**
 * Stackra file contract:
 * Purpose: `TENANCY_TESTING_PLUGIN`, the testing-module plugin of @stackra/tenancy: a `memory` candidate of the
 *          `CallIsolation` port, `MemoryCallIsolationDriver`, so a test that compiles with `.useDrivers("memory")` runs
 *          every call and background unit as its actor's tenant, as production does, and `BelongsToTenant` rows
 *          carry it.
 * Boundary: a test-only candidate: it joins the port's table only when the test picks `memory` for it, so a
 *           production wiring never lists it. Registered on import of `./testing` (gen's Vitest setup imports it for a
 *           member on @stackra/tenancy). An `.override(CallIsolation, …)` still wins.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: testing plugins); ADR 0266 (memory first); ADR 0495.
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingPlugin } from "@stackra/container/testing";

import { MemoryCallIsolationDriver } from "#testing/drivers/memory-call-isolation.driver";

/** The tenancy testing-module plugin. */
export const TENANCY_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/tenancy",
  drivers: [
    {
      port: CallIsolation,
      key: "actions.CallIsolation",
      candidates: { memory: () => Promise.resolve(MemoryCallIsolationDriver) },
    },
  ],
};

registerTestingPlugin(TENANCY_TESTING_PLUGIN);
