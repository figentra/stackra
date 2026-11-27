/**
 * Stackra file contract:
 * Purpose: the vitest config Stryker runs (`stryker.config.mjs`, `pnpm test:mutation`): this package's unit tier,
 *          less the declaration-emit test, which compiles against the TypeScript preset by a path relative to the
 *          package folder and so cannot run from Stryker's sandbox, and checks emitted types, which no mutant changes.
 * Boundary: test configuration only; `pnpm test` keeps running every unit test through `vitest.config.ts`.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-2887.
 */
import { defineConfig, mergeConfig } from "vitest/config";

import unit from "./vitest.config";

export default mergeConfig(
  unit,
  defineConfig({ test: { exclude: ["src/core/bases/__tests__/policy-declarations.test.ts"] } }),
);
