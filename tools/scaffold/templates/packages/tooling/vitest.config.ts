/**
 * Stackra file contract:
 * Purpose: test config of @stackra/{{NAME}}-config — plain vitest for the preset's own tests; `passWithNoTests` off so
 *          an empty suite fails. A tooling preset does not consume the framework vitest preset.
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/__tests__/**/*.test.ts"], passWithNoTests: false },
});
