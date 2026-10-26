/**
 * Stackra file contract:
 * Purpose: test config of @stackra/oxlint-config — plain vitest for the preset's own tests; `passWithNoTests` off so an
 *          empty suite fails (AGENTS.md). A tooling preset does not consume the framework vitest preset it ships.
 * Boundary: test configuration of @stackra/oxlint-config only. Owner: release-operations; Secrets: forbidden.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/__tests__/**/*.test.ts"], passWithNoTests: false },
});
