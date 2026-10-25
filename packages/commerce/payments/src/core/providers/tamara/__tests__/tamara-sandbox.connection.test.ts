/**
 * Stackra file contract:
 * Purpose: unit tests of `TamaraSandboxConnection`: the Tamara driver under the sandbox provider code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { TamaraConnection } from "#core/providers/tamara/tamara.connection";
import { TamaraSandboxConnection } from "#core/providers/tamara/tamara-sandbox.connection";
import { TamaraSandboxIntegration } from "#core/providers/tamara/tamara-sandbox.integration";

describe("TamaraSandboxConnection", () => {
  it("is the Tamara driver under the sandbox code", () => {
    const sandbox = makeConnection(TamaraSandboxConnection, {
      api: fakeIntegrationApi(TamaraSandboxIntegration, () => undefined),
      fields: { apiToken: "t", paymentType: "PAY_BY_INSTALMENTS" },
    });
    expect(sandbox).toBeInstanceOf(TamaraConnection);
    expect(sandbox.provider).toBe("tamara-sandbox");
  });
});
