/**
 * Stackra file contract:
 * Purpose: the base vitest preset every workspace extends. Globals on (describe/it/expect without imports),
 *          `passWithNoTests` OFF so an empty suite is a finding, not a pass, and the v8 coverage provider.
 *          Service tests boot PGlite, so it sets the `forks` pool, `maxWorkers` at half the CPUs (override with
 *          `STACKRA_TEST_MAX_WORKERS`), `testTimeout` 30 s and `hookTimeout` 60 s; the int tier keeps its own
 *          `fileParallelism: false`.
 *          The coverage thresholds themselves live in the repo root `vitest.shared.ts` (`withCoverage`), so one
 *          place owns the gate. Resolution prefers the `@stackra/source` export condition (ADR 0025), so a test reads a
 *          workspace package's source, not its built dist; the rest of each list is Vite's default, except that SSR
 *          drops `module`: externalized deps are loaded by Node, so the `node` (CJS) build must win over ESM
 *          builds that only bundlers can load (@aws-sdk/checksums dist-es has extensionless imports). Legacy decorators
 *          (ADR 0005) are transformed in every member: a test reads workspace sources, and any package may declare a
 *          decorated schema or settings class, so a member without decorators still loads one that has them.
 * Boundary: the base config only; it declares no test and no setup file.
 * Runtime: node
 * Governing contract: ADR 0007 (documentation); ADR 0022 (test placement); ADR 0005 (legacy decorators).
 * Owner: release-operations · Secrets: forbidden
 */
import { defineConfig } from "vitest/config";

import { HOOK_TIMEOUT_MS } from "./constants/hook-timeout.constant.ts";
import { TEST_TIMEOUT_MS } from "./constants/test-timeout.constant.ts";
import { testMaxWorkers } from "./functions/test-max-workers.function.ts";

/**
 * Base vitest preset used by all workspace members.
 * Enables globals (describe, it, expect) to avoid imports; fails a suite with no tests; reports v8 coverage.
 * Coverage thresholds are added by `withCoverage()` from the coverage module.
 */
export const stackraVitest = defineConfig({
  resolve: { conditions: ["@stackra/source", "module", "browser", "development|production"] },
  // `module` omitted on purpose: Node loads these files natively, see the docblock.
  ssr: { resolve: { conditions: ["@stackra/source", "node", "development|production"] } },
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
  test: {
    globals: true,
    passWithNoTests: false,
    environment: "node",
    pool: "forks",
    maxWorkers: testMaxWorkers(),
    testTimeout: TEST_TIMEOUT_MS,
    hookTimeout: HOOK_TIMEOUT_MS,
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
});
