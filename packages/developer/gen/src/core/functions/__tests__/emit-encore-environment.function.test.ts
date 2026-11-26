/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreEnvironment` (STA-1571): a service with a server entry gets
 *          `stackra-encore/<member>/environment.ts`, which hands Encore's `appMeta().environment` to
 *          `provideRuntimeEnvironment`, so a deployment that sets no `STACKRA_ENVIRONMENT` never boots as `dev`; a
 *          package, an app and a service with no root module get none.
 * Boundary: test only; asserts on the generated source text of the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); ADR 0212 (decisions 1 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreEnvironment } from "#core/functions/emit-encore-environment.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

describe(emitEncoreEnvironment, () => {
  it("provides Encore's environment to the server app of a service", () => {
    const file = emitEncoreEnvironment(COMMERCE_IR);
    expect(file?.path).toBe("stackra-encore/commerce/environment.ts");
    expect(file?.content).toContain(
      'import { provideRuntimeEnvironment } from "@stackra/app/server";',
    );
    expect(file?.content).toContain('import { appMeta } from "encore.dev";');
    expect(file?.content).toContain("provideRuntimeEnvironment(appMeta().environment);");
  });

  it("writes none for a package, an app or a service with an authored main", () => {
    expect(emitEncoreEnvironment({ ...COMMERCE_IR, layout: "package" })).toBeUndefined();
    expect(emitEncoreEnvironment({ ...COMMERCE_IR, layout: "app" })).toBeUndefined();
    expect(emitEncoreEnvironment({ ...COMMERCE_IR, authoredMain: true })).toBeUndefined();
  });
});
