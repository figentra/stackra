/**
 * Stackra file contract:
 * Purpose: unit tests of `deployedTarget`: a server in a deployed environment refuses, whatever the call says; a
 *          server with no `STACKRA_ENVIRONMENT` (unset or empty) refuses too (fail closed); a dev or test server
 *          refuses a call naming a deployed environment (`env` or `environment`), and lets local calls through.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2873.
 */
import { describe, expect, it } from "@stackra/testing";

import { deployedTarget } from "#node/functions/deployed-target.function";

describe("deployedTarget", () => {
  it("refuses everything on a deployed server", () => {
    for (const name of ["preview", "staging", "production", "demo"])
      expect(deployedTarget({ STACKRA_ENVIRONMENT: name }, { env: "dev" })).toBe(
        `the server runs in ${name} (STACKRA_ENVIRONMENT)`,
      );
  });

  it("refuses everything on a server whose environment is unset or empty", () => {
    for (const env of [{}, { STACKRA_ENVIRONMENT: undefined }, { STACKRA_ENVIRONMENT: "" }])
      for (const input of [undefined, {}, { env: "dev" }])
        expect(deployedTarget(env, input)).toBe(
          "the server's STACKRA_ENVIRONMENT is unset, so it may be a deployed runtime",
        );
  });

  it("refuses a local call that names a deployed environment", () => {
    expect(deployedTarget({ STACKRA_ENVIRONMENT: "test" }, { env: "production" })).toBe(
      "the call names the production environment (env)",
    );
    expect(deployedTarget({ STACKRA_ENVIRONMENT: "dev" }, { environment: "staging" })).toBe(
      "the call names the staging environment (environment)",
    );
  });

  it("lets local calls through on a dev or test server", () => {
    expect(deployedTarget({ STACKRA_ENVIRONMENT: "dev" }, undefined)).toBeUndefined();
    expect(deployedTarget({ STACKRA_ENVIRONMENT: "dev" }, {})).toBeUndefined();
    expect(
      deployedTarget({ STACKRA_ENVIRONMENT: "test" }, { env: "dev", environment: "" }),
    ).toBeUndefined();
    expect(deployedTarget({ STACKRA_ENVIRONMENT: "dev" }, { env: 3 })).toBeUndefined();
  });
});
