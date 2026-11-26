/**
 * Stackra file contract:
 * Purpose: test config of @figentra/docs — the shared vitest preset over the docs scripts' tests (the system-map
 *          renderer in `scripts/system-map/__tests__`, the API reference generator in `scripts/api-reference/__tests__`)
 *          and the Worker script's (`worker/__tests__`); the site itself has no TypeScript runtime to test.
 * Boundary: test configuration only.
 * Runtime: node
 * Governing contract: ADR 0182 (testing strategy); ADR 0300 (published tooling presets); ADR 0452 (the system map);
 *                     STA-2857 (the API reference).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig({
    test: { include: ["scripts/**/__tests__/**/*.test.ts", "worker/**/__tests__/**/*.test.ts"] },
  }),
);
