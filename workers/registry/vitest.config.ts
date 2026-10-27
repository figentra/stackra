/**
 * Stackra file contract:
 * Purpose: test config of @figentra/worker-registry — the shared vitest preset; this file adds only the include glob
 *          (tests sit beside the code, in `__tests__` folders under src). The Worker's bindings are faked in
 *          `src/__tests__/fixtures` (D1 over node:sqlite with the real migrations, R2, KV and the edge cache in
 *          memory), so no Workers pool or miniflare is needed. Apps carry no coverage gate.
 * Boundary: test configuration only.
 * Runtime: node
 * Governing contract: ADR 0182 (testing strategy); ADR 0300 (published tooling presets); ADR 0453 (Enforcement).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig({ test: { include: ["src/**/__tests__/**/*.test.ts"] } }),
);
