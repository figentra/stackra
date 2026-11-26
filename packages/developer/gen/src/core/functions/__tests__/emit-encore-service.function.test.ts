/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreService`: a service gets `stackra-encore/<member>/encore.service.ts`, whose
 *          default export is `new Service("<member>")` from `encore.dev/service`; a package and an app get none.
 * Boundary: test only; asserts on the generated source text of the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); STA-2063 (FR-001).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreService } from "#core/functions/emit-encore-service.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

describe(emitEncoreService, () => {
  it("declares the Encore service of a service, named by its member key", () => {
    const file = emitEncoreService(COMMERCE_IR);
    expect(file?.path).toBe("stackra-encore/commerce/encore.service.ts");
    expect(file?.content).toContain('import { Service } from "encore.dev/service";');
    expect(file?.content).toContain('export default new Service("commerce");');
  });

  it("writes none for a package or an app", () => {
    expect(emitEncoreService({ ...COMMERCE_IR, layout: "package" })).toBeUndefined();
    expect(emitEncoreService({ ...COMMERCE_IR, layout: "app" })).toBeUndefined();
  });
});
