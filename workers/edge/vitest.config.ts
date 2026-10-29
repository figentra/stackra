/**
 * Stackra file contract:
 * Purpose: test config of @figentra/worker-edge — the shared vitest preset; this file adds only the include glob (tests
 *          sit beside the code, in `__tests__` folders under src). The origin is a fetch stub, so no Workers pool or
 *          miniflare is needed. Apps carry no coverage gate.
 * Boundary: test configuration only.
 * Runtime: node
 * Governing contract: ADR 0182 (testing strategy); ADR 0300 (published tooling presets); ADR 0437 (Enforcement).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig({ test: { include: ["src/**/__tests__/**/*.test.ts"] } }),
);
