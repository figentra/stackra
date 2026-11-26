/**
 * Stackra file contract:
 * Purpose: unit tests of `isCoreRepository`: a workspace with the `@stackra/cli` member is the core repository; an app
 *          that only depends on the CLI, or has no manifests, is not.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: STA-2872 spec FR-002; ADR 0022 (test placement).
 */
// @covers sta-2872:FR-002
import { describe, expect, it } from "@stackra/testing";

import { isCoreRepository } from "#node/functions/is-core-repository.function";

const workspace = (manifests: unknown[]) => ({ manifests, scripts: {}, devPorts: [] });

describe("isCoreRepository", () => {
  it("is true where a member is @stackra/cli", () => {
    expect(isCoreRepository(workspace([{ name: "stackra" }, { name: "@stackra/cli" }]))).toBe(true);
  });

  it("is false for an app that depends on the CLI", () => {
    expect(
      isCoreRepository(
        workspace([{ name: "acme-platform", devDependencies: { "@stackra/cli": "1.0.0" } }]),
      ),
    ).toBe(false);
  });

  it("is false with no or odd manifests", () => {
    expect(isCoreRepository(workspace([]))).toBe(false);
    expect(isCoreRepository(workspace([null, "@stackra/cli", 3]))).toBe(false);
  });
});
