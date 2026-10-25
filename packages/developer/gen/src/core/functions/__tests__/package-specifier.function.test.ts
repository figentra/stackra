/**
 * Stackra file contract:
 * Purpose: unit tests of `packageSpecifier`: a dependency's class is imported from the entry that exports its file;
 *          `.` is the bare package name, and a file outside the entry folders (or none) falls back to `node`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0260.
 */
import { describe, expect, it } from "@stackra/testing";

import { packageSpecifier } from "#core/functions/package-specifier.function";

describe("packageSpecifier", () => {
  it("names the entry that exports the file", () => {
    expect(packageSpecifier("@stackra/outbox", "src/core/drivers/memory-outbox.driver.ts")).toBe(
      "@stackra/outbox",
    );
    expect(packageSpecifier("@stackra/segments", "src/node/models/segment.model.ts")).toBe(
      "@stackra/segments/node",
    );
    expect(packageSpecifier("@acme/kit", "src/node/database/factories/a.factory.ts")).toBe(
      "@acme/kit/testing",
    );
  });

  it("falls back to the node entry", () => {
    expect(packageSpecifier("@acme/kit", "src/modules/a/a.model.ts")).toBe("@acme/kit/node");
    expect(packageSpecifier("@acme/kit", undefined)).toBe("@acme/kit/node");
  });
});
