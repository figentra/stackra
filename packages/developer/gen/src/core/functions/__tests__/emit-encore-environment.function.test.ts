/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreEnvironment` (STA-2844): a service that runs `@stackra/app` from the generated
 *          server entry gets `stackra-encore/<member>/environment.ts`, which hands Encore's `appMeta().environment` to
 *          `providePlatformEnvironment`; a package, an app, a v2 service with an authored main and a service without
 *          `@stackra/app` get none.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091; ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreEnvironment } from "#core/functions/emit-encore-environment.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The commerce service, declaring `@stackra/app`. */
const SERVED = { ...COMMERCE_IR, packages: ["@stackra/app"] };

describe("emitEncoreEnvironment", () => {
  it("settles the running environment from Encore's report", () => {
    const file = emitEncoreEnvironment(SERVED);
    expect(file?.path).toBe("stackra-encore/commerce/environment.ts");
    const lines = (file?.content ?? "").split("\n");
    expect(lines).toContain('import { providePlatformEnvironment } from "@stackra/app/server";');
    expect(lines).toContain('import { appMeta } from "encore.dev";');
    expect(lines).toContain("providePlatformEnvironment(appMeta().environment);");
    // The environment is never set here: the one reader decides it.
    expect(file?.content).not.toMatch(/process\.env/);
  });

  it("writes nothing for a package, an app, a v2 service or a service without @stackra/app", () => {
    expect(emitEncoreEnvironment(LOYALTY_KIT_IR)).toBeUndefined();
    expect(emitEncoreEnvironment(WEB_APP_IR)).toBeUndefined();
    expect(emitEncoreEnvironment({ ...SERVED, authoredMain: true })).toBeUndefined();
    expect(
      emitEncoreEnvironment({
        ...COMMERCE_IR,
        packages: [],
        dependencies: COMMERCE_IR.dependencies.filter(
          (dependency) => dependency.package !== "@stackra/app",
        ),
      }),
    ).toBeUndefined();
  });
});
