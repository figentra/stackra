/**
 * Stackra file contract:
 * Purpose: test config of @figentra/mobile — the shared vitest preset; this file adds only the include glob (tests sit
 *          beside the code, in `__tests__` folders under src). Today the suites cover plain TypeScript modules (stores);
 *          screens are checked on a device. Apps carry no coverage gate (task vocabulary).
 * Boundary: test configuration only.
 * Runtime: node
 * Governing contract: ADR 0182 (testing strategy); ADR 0300 (published tooling presets).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig({ test: { include: ["src/**/__tests__/**/*.test.ts"] } }),
);
