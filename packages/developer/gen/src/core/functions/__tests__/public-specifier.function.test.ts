/**
 * Stackra file contract:
 * Purpose: unit tests of `publicSpecifier`: a package's subpath import becomes the entry that exports its folder; a
 *          package specifier and a member's generated `#stackra/*` file are kept.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); STA-1297.
 */
import { describe, expect, it } from "@stackra/testing";

import { publicSpecifier } from "#core/functions/public-specifier.function";

describe("publicSpecifier", () => {
  it("maps a subpath import to its entry", () => {
    expect(publicSpecifier("@stackra/settings", "#contracts/index")).toBe(
      "@stackra/settings/contracts",
    );
    expect(publicSpecifier("@stackra/media", "#config/media.config")).toBe("@stackra/media");
    expect(publicSpecifier("@stackra/media", "#core/drivers/memory-media-disk.driver")).toBe(
      "@stackra/media",
    );
    expect(publicSpecifier("@stackra/locking", "#node/drivers/postgres-lock.driver")).toBe(
      "@stackra/locking/node",
    );
  });

  it("keeps a package specifier and a generated file", () => {
    expect(publicSpecifier("@stackra/media", "@stackra/filesystem")).toBe("@stackra/filesystem");
    expect(publicSpecifier("@stackra/media", "#stackra/i18n")).toBe("#stackra/i18n");
  });
});
