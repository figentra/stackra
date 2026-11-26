/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreEnvironment` and `encoreFirstImports`: a service's Encore environment file sets
 *          `STACKRA_ENVIRONMENT` from Encore's `appMeta().environment` through `runningEnvironment`, and every Encore
 *          file loads it first, before the database and the server app, so a deployed boot sees its environment with
 *          no hand-set variable (STA-2798); a package, an app and a v2 service get none.
 * Boundary: test only; runs on the IR fixtures and the manifests built from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); ADR 0266 (decision 2); STA-2798.
 */
import { describe, expect, it } from "@stackra/testing";

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreApi } from "#core/functions/emit-encore-api.function";
import { emitEncoreEnvironment } from "#core/functions/emit-encore-environment.function";
import { encoreFirstImports } from "#core/functions/encore-first-imports.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe(emitEncoreEnvironment, () => {
  it("sets STACKRA_ENVIRONMENT from Encore's report before the app boots", () => {
    const file = emitEncoreEnvironment(COMMERCE_IR);
    expect(file?.path).toBe("stackra-encore/commerce/environment.ts");
    const content = file?.content ?? "";
    expect(content).toContain('import { runningEnvironment } from "@stackra/app/server";');
    expect(content).toContain('import { appMeta } from "encore.dev";');
    expect(content).toContain(
      'const running = runningEnvironment(process.env["STACKRA_ENVIRONMENT"], appMeta().environment);',
    );
    expect(content).toContain(
      'if (running !== undefined) process.env["STACKRA_ENVIRONMENT"] = running;',
    );
  });

  it("is loaded first by every Encore file, ahead of the server app", () => {
    expect(encoreFirstImports(COMMERCE_IR)[0]).toBe('import "./environment";');
    const lines = (emitEncoreApi(COMMERCE_IR, buildManifest(COMMERCE_IR).manifest)?.content ?? "")
      .split("\n")
      .filter((line) => line.startsWith("import "));
    expect(lines[0]).toBe('import "./environment";');
    expect(lines.indexOf('import "./environment";')).toBeLessThan(lines.indexOf(ENCORE_APP_IMPORT));
  });

  it("writes none for a package, an app or a v2 service, which then import none", () => {
    expect(emitEncoreEnvironment(LOYALTY_KIT_IR)).toBeUndefined();
    expect(emitEncoreEnvironment({ ...COMMERCE_IR, layout: "app" })).toBeUndefined();
    const v2 = { ...COMMERCE_IR, authoredMain: true as const };
    expect(emitEncoreEnvironment(v2)).toBeUndefined();
    expect(encoreFirstImports(v2)).not.toContain('import "./environment";');
  });
});
