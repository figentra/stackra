/**
 * Stackra file contract:
 * Purpose: test config of @figentra/worker-turbo-cache: the shared vitest preset, as workers/static uses it; this file
 *          adds only the include glob (tests sit beside the code, in `__tests__` folders under src). The handler is
 *          tested in Node against an in-memory R2 stand-in, not in workerd. Apps carry no coverage gate.
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
