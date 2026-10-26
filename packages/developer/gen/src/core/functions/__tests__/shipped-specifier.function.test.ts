/**
 * Stackra file contract:
 * Purpose: unit tests of `shippedSpecifier`: a shipped `X$` is imported from the `.` or `./contracts` entry whose
 *          barrel exports it, in source or built form; any other file is no source.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 15 and 26); STA-1290.
 */
import { describe, expect, it } from "@stackra/testing";

import { shippedSpecifier } from "#core/functions/shipped-specifier.function";

describe("shippedSpecifier", () => {
  it("names the isomorphic entry of a source barrel", () => {
    expect(shippedSpecifier("@stackra/validation", "src/core/index.ts")).toBe(
      "@stackra/validation",
    );
    expect(shippedSpecifier("@stackra/iam", "src/contracts/index.ts")).toBe(
      "@stackra/iam/contracts",
    );
  });

  it("names the isomorphic entry of a built barrel", () => {
    expect(shippedSpecifier("@stackra/rules", "dist/index.d.mts")).toBe("@stackra/rules");
    expect(shippedSpecifier("@stackra/geo", "index.d.ts")).toBe("@stackra/geo");
    expect(shippedSpecifier("@stackra/settings", "dist/contracts.d.mts")).toBe(
      "@stackra/settings/contracts",
    );
  });

  it("refuses the server, test and non-barrel files", () => {
    expect(shippedSpecifier("@stackra/iam", "src/node/index.ts")).toBeUndefined();
    expect(shippedSpecifier("@stackra/iam", "dist/testing.d.mts")).toBeUndefined();
    expect(
      shippedSpecifier("@stackra/validation", "src/core/constants/address-schema.constant.ts"),
    ).toBeUndefined();
  });
});
