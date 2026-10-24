/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra`: called, it returns the preset's own plugins; `stackra.viteConfig` is the whole
 *          config builder the generated `.stackra/vite.config.ts` calls.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0261 (decision 4); ADR 0295 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { stackra } from "#core/functions/stackra.function";
import { viteConfig } from "#core/functions/vite-config.function";

describe("stackra", () => {
  it("returns the preset's plugins when called", () => {
    expect(stackra().map(({ name }) => name)).toEqual([
      "stackra:class-components",
      "stackra:generated-modules",
      "stackra:server-only",
    ]);
  });

  it("carries viteConfig for the generated config", () => {
    expect(stackra.viteConfig).toBe(viteConfig);
  });
});
