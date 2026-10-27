/**
 * Stackra file contract:
 * Purpose: test config of @stackra/typescript-config — plain vitest for the preset's own tests; `passWithNoTests` off so an
 *          empty suite fails (AGENTS.md). A tooling preset does not consume the framework vitest preset it ships.
 * Boundary: the preset's own tests only; owner release-operations, no secrets.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement)
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/__tests__/**/*.test.ts"], passWithNoTests: false },
});
