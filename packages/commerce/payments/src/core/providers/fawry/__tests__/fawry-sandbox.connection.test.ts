/**
 * Stackra file contract:
 * Purpose: unit tests of `FawrySandboxConnection`: the FawryPay driver under the sandbox code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { FawryConnection } from "#core/providers/fawry/fawry.connection";
import { FawrySandboxConnection } from "#core/providers/fawry/fawry-sandbox.connection";
import { FawrySandboxIntegration } from "#core/providers/fawry/fawry-sandbox.integration";

describe("FawrySandboxConnection", () => {
  it("is the FawryPay driver under the sandbox code", () => {
    const sandbox = makeConnection(FawrySandboxConnection, {
      api: fakeIntegrationApi(FawrySandboxIntegration, () => undefined),
      fields: { merchantCode: "m", secureKey: "k", currency: "EGP" },
    });
    expect(sandbox).toBeInstanceOf(FawryConnection);
    expect(sandbox.provider).toBe("fawry-sandbox");
  });
});
