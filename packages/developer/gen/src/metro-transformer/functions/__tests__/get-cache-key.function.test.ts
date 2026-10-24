/**
 * Stackra file contract:
 * Purpose: unit tests of `getCacheKey`: the pass name and version joined with the upstream transformer's key, and a
 *          key without the upstream part when the app has none.
 * Boundary: test only; points the working directory at a stand-in app root.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0127 2026-10-24 note.
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { getCacheKey } from "#metro-transformer/functions/get-cache-key.function";
import { writeMetroProject } from "#metro-transformer/__tests__/fixtures/write-metro-project";

describe("getCacheKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("joins the pass version and the upstream key", () => {
    vi.spyOn(process, "cwd").mockReturnValue(writeMetroProject());
    expect(getCacheKey()).toBe("stackra-class-components@1:rn-key");
  });

  it("keeps a key without an upstream transformer", () => {
    vi.spyOn(process, "cwd").mockReturnValue("/nonexistent/stackra-app");
    expect(getCacheKey()).toBe("stackra-class-components@1:");
  });
});
