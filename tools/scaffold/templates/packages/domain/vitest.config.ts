/**
 * Stackra file contract:
 * Purpose: test config of @stackra/{{NAME}} — the shared vitest preset plus the shared coverage gate; this file
 *          adds only the include glob (tests sit beside the code, in `__tests__` folders under src).
 * Owner: the package owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { withCoverage } from "@stackra/vitest-config/coverage";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig(withCoverage({ test: { include: ["src/**/__tests__/**/*.test.ts"] } })),
);
