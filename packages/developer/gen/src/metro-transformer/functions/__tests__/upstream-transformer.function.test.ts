/**
 * Stackra file contract:
 * Purpose: unit tests of `upstreamTransformer`: the app's transformer resolved from its root and loaded once per
 *          root, and a root with none refused with the install hint.
 * Boundary: test only; writes a stand-in app root under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import { upstreamTransformer } from "#metro-transformer/functions/upstream-transformer.function";
import { writeMetroProject } from "#metro-transformer/__tests__/fixtures/write-metro-project";

describe("upstreamTransformer", () => {
  it("resolves the app's transformer once", () => {
    const root = writeMetroProject();
    const transformer = upstreamTransformer(root);
    expect(transformer.getCacheKey?.()).toBe("rn-key");
    expect(upstreamTransformer(root)).toBe(transformer);
  });

  it("refuses an app without a Babel transformer", () => {
    expect(() => upstreamTransformer("/nonexistent/stackra-app")).toThrow(
      /no Metro Babel transformer/,
    );
  });
});
