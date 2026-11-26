/**
 * Stackra file contract:
 * Purpose: unit tests of `runningEnvironment`: Encore's own reports (the ones `encore run`, `encore test`, Encore Cloud
 *          and a self-hosted build give, read on box 2 with encore 1.58.8) map to the environment a process runs as; a
 *          deployed one never runs as dev or test, and an unknown one fails closed. A server boot with the derived
 *          value and no hand-set variable refuses the memory action stores (STA-2798).
 * Boundary: test only; the reports are plain objects shaped as `appMeta().environment`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0266 (decision 2); ADR 0091 (decision 2); STA-2798.
 */
import { StoresConfig } from "@stackra/actions";
import { ConfigInvalidError } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { bootApp } from "#core/functions/boot-app.function";
import { runningEnvironment } from "#server/functions/running-environment.function";

/** What Encore 1.58.8 reported on box 2 for each way of running. */
const REPORTED = {
  run: { name: "local", type: "development", cloud: "local" },
  test: { name: "test", type: "test", cloud: "local" },
  production: { name: "prod-eu", type: "production", cloud: "aws" },
  staging: { name: "staging", type: "development", cloud: "aws" },
  bare: { name: "", type: "development", cloud: "local" },
} as const;

describe("runningEnvironment", () => {
  it("keeps the declared value under encore run and encore test, unset reading as dev", () => {
    expect(runningEnvironment(undefined, REPORTED.run)).toBeUndefined();
    expect(runningEnvironment("", REPORTED.run)).toBeUndefined();
    expect(runningEnvironment("test", REPORTED.test)).toBe("test");
    expect(runningEnvironment("staging", REPORTED.run)).toBe("staging");
  });

  it("derives a deployed environment from Encore's report when nothing declares one", () => {
    expect(runningEnvironment(undefined, REPORTED.production)).toBe("production");
    expect(runningEnvironment(undefined, REPORTED.staging)).toBe("staging");
    expect(
      runningEnvironment(undefined, { name: "pr-12", type: "ephemeral", cloud: "encore" }),
    ).toBe("preview");
    // a cloud environment with any other name is deployed all the same
    expect(runningEnvironment(undefined, { name: "qa", type: "development", cloud: "gcp" })).toBe(
      "staging",
    );
    // production wins even where the cloud reads local (self-hosted metadata without `cloud`)
    expect(
      runningEnvironment(undefined, { name: "prod", type: "production", cloud: "local" }),
    ).toBe("production");
  });

  it("lets a declared deployed environment win, and refuses dev or test in a deployed one", () => {
    expect(runningEnvironment("preview", REPORTED.staging)).toBe("preview");
    expect(runningEnvironment("production", REPORTED.bare)).toBe("production");
    for (const declared of ["dev", "test"])
      expect(() => runningEnvironment(declared, REPORTED.production)).toThrow(
        /^env is invalid: STACKRA_ENVIRONMENT: is (dev|test), but the host runs a deployed production environment "prod-eu" on aws/,
      );
  });

  it("fails closed when the host reports nothing usable and nothing is declared", () => {
    expect(() => runningEnvironment(undefined, REPORTED.bare)).toThrow(ConfigInvalidError);
    expect(() => runningEnvironment(undefined, REPORTED.bare)).toThrow(
      /STACKRA_ENVIRONMENT: is not set, and the host reports no deployed environment/,
    );
  });

  it("makes a deployed boot refuse the memory action stores with no hand-set variable (STA-2798)", async () => {
    const wiring = { member: "orders", config: [{ key: "actions.stores", provide: StoresConfig }] };
    const environment = runningEnvironment(undefined, REPORTED.production);
    await expect(bootApp(wiring, { env: { STACKRA_ENVIRONMENT: environment } })).rejects.toThrow(
      /^StoresConfig is invalid: idempotency: .*production refuses it/,
    );
  });
});
