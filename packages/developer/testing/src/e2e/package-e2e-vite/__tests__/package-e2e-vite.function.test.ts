/**
 * Stackra file contract:
 * Purpose: unit tests of `packageE2eVite`: the served root, the readable package folder and the automatic JSX runtime.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement; package e2e).
 */
import { describe, expect, it } from "@stackra/testing";

import { packageE2eVite } from "#e2e/package-e2e-vite/package-e2e-vite.function";

describe(packageE2eVite, () => {
  const config = packageE2eVite({ root: "/repo/packages/ui/button" });

  it("serves the generated app and lets it read the package", () => {
    expect(config.root).toBe("/repo/packages/ui/button/.stackra/e2e");
    expect(config.server?.fs?.allow).toEqual(["/repo/packages/ui/button"]);
  });

  it("compiles JSX with the automatic runtime and no plugin", () => {
    expect(config.esbuild).toEqual({ jsx: "automatic" });
    expect(config.plugins).toBeUndefined();
  });
});
