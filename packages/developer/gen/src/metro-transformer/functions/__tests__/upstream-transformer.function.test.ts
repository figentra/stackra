/**
 * Stackra file contract:
 * Purpose: unit tests of `upstreamTransformer`: the app's transformer resolved from its root and loaded once per
 *          root, and a root with none refused with the install hint (skipped where every root resolves one).
 * Boundary: test only; writes a stand-in app root under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0127 2026-10-24 note.
 */
import { createRequire } from "node:module";

import { describe, expect, it } from "@stackra/testing";

import { upstreamTransformer } from "#metro-transformer/functions/upstream-transformer.function";
import { writeMetroProject } from "#metro-transformer/__tests__/fixtures/write-metro-project";

/** Whether a root with no node_modules of its own still resolves a transformer. */
const installedEverywhere = [
  "@expo/metro-config/babel-transformer",
  "@react-native/metro-babel-transformer",
].some((candidate) => {
  try {
    createRequire("/nonexistent/stackra-app/package.json").resolve(candidate);
    return true;
  } catch {
    return false;
  }
});

describe("upstreamTransformer", () => {
  it("resolves the app's transformer once", () => {
    const root = writeMetroProject();
    const transformer = upstreamTransformer(root);
    expect(transformer.getCacheKey?.()).toBe("rn-key");
    expect(upstreamTransformer(root)).toBe(transformer);
  });

  // A machine that installs a transformer where every root resolves it (a global or `/node_modules` one, as on
  // ci-box) has no root without one, so the refusal is only checked where none resolves.
  it.skipIf(installedEverywhere)("refuses an app without a Babel transformer", () => {
    expect(() => upstreamTransformer("/nonexistent/stackra-app")).toThrow(
      /no Metro Babel transformer/,
    );
  });
});
