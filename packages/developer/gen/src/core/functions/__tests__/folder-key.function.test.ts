/**
 * Stackra file contract:
 * Purpose: unit tests of `folderKey`: a member's or module's key is its folder name in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (2026-10-23 item 14).
 */
import { describe, expect, it } from "@stackra/testing";

import { folderKey } from "#core/functions/folder-key.function";

describe("folderKey", () => {
  it("snake-cases the folder name", () => {
    expect(folderKey("loyalty-kit")).toBe("loyalty_kit");
    expect(folderKey("commerce")).toBe("commerce");
  });
});
