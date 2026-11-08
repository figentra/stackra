/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncorePackage`: the Encore app root gets a private ES-module `package.json`, named
 *          after the service's package, with no dependencies of its own.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncorePackage } from "#core/functions/emit-encore-package.function";

describe("emitEncorePackage", () => {
  it("writes a private ES-module package.json at the Encore app root", () => {
    const file = emitEncorePackage("@figentra/service-sales");
    expect(file.path).toBe(".stackra/encore/package.json");
    expect(JSON.parse(file.content)).toEqual({
      name: "@figentra/service-sales-encore",
      private: true,
      type: "module",
    });
    expect(file.content.endsWith("}\n")).toBe(true);
  });
});
