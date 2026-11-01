/**
 * Stackra file contract:
 * Purpose: unit tests of `isModuleFolder`: feature folders are modules; test, mock and dot folders are not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1696.
 */
import { describe, expect, it } from "@stackra/testing";

import { isModuleFolder } from "#core/functions/is-module-folder.function";

describe("isModuleFolder", () => {
  it("takes a feature folder, kebab or snake case", () => {
    expect(isModuleFolder("orders")).toBe(true);
    expect(isModuleFolder("price-lists")).toBe(true);
    expect(isModuleFolder("sales_channels")).toBe(true);
  });

  it("refuses test, mock and dot folders", () => {
    for (const name of ["__tests__", "__mocks__", "_fixtures", ".cache", "Shared"])
      expect(isModuleFolder(name)).toBe(false);
  });
});
