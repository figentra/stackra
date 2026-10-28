/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template's tests import `fakeIntegrationApi` and
 *          `makeConnection` from it, the memory connectors and the recorded-case runners (accounting, any connector,
 *          fulfilment) are the other
 *          values with the plugin, and the helpers return what the template passes on (an `IntegrationApi`, the
 *          connection class's instance).
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { IntegrationApi } from "#core/index";
import * as testing from "#testing/index";

describe("@stackra/integrations/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "INTEGRATIONS_TESTING_PLUGIN",
      "MemoryAccountingConnector",
      "MemoryAdPlatform",
      "MemoryFulfilmentProvider",
      "MemoryPayrollConnector",
      "fakeIntegrationApi",
      "makeConnection",
      "replayIntegrationApi",
      "runAccountingCase",
      "runConnectorCase",
      "runEdiCase",
      "runFulfilmentCase",
    ]);
    expect(testing.INTEGRATIONS_TESTING_PLUGIN.name).toBe("@stackra/integrations");
  });

  it("returns a managed client", () => {
    expectTypeOf(testing.fakeIntegrationApi).returns.toEqualTypeOf<IntegrationApi>();
  });
});
