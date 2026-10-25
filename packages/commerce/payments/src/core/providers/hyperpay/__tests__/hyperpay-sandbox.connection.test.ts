/**
 * Stackra file contract:
 * Purpose: unit tests of `HyperpaySandboxConnection`: the HyperPay driver under the sandbox code, loading the widget
 *          from the test host.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { HyperpayConnection } from "#core/providers/hyperpay/hyperpay.connection";
import { HyperpaySandboxConnection } from "#core/providers/hyperpay/hyperpay-sandbox.connection";
import { HyperpaySandboxIntegration } from "#core/providers/hyperpay/hyperpay-sandbox.integration";

describe("HyperpaySandboxConnection", () => {
  it("is the HyperPay driver on the test host", () => {
    const sandbox = makeConnection(HyperpaySandboxConnection, {
      api: fakeIntegrationApi(HyperpaySandboxIntegration, () => undefined),
      fields: { accessToken: "t", entityId: "e" },
    });
    expect(sandbox).toBeInstanceOf(HyperpayConnection);
    expect(sandbox.provider).toBe("hyperpay-sandbox");
    expect(sandbox.origin).toBe("https://eu-test.oppwa.com");
  });
});
