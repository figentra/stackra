/**
 * Stackra file contract:
 * Purpose: unit tests of `CONTEXT_REGISTRY`: it starts with this package's own `i18n` context.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { CONTEXT_REGISTRY } from "#react/contexts/context-registry.constant";
import { I18nMount } from "#react/contexts/i18n-mount";

describe("CONTEXT_REGISTRY", () => {
  it("starts with the i18n context", () => {
    expect(CONTEXT_REGISTRY.get("i18n")).toBe(I18nMount);
  });
});
