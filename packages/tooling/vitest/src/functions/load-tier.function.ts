/**
 * Stackra file contract:
 * Purpose: `loadTier(config)`, which narrows a member's own vitest config to the load tier (`LOAD_TESTS`), so
 *          `test:load` keeps the member's preset, aliases and generated setup and runs only the `.load.test.ts` files.
 * Boundary: returns a new config; it runs no tests. Replaces `include` and `exclude` outright (mergeConfig would
 *           concatenate the unit tier's exclude of `*.load.test.ts`), runs one file at a time and one test at a time so
 *           two soaks never share the box, and lifts the timeouts to the soak's length. A config built from `projects`
 *           is not narrowed.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the load tier, weekly k6 load tests); ADR 0022 (test placement);
 *                     STA-317.
 */
import { configDefaults, type ViteUserConfig as UserConfig } from "vitest/config";

import { LOAD_TEST_TIMEOUT_MS } from "../constants/load-test-timeout.constant.ts";
import { LOAD_TESTS } from "../constants/load-tests.constant.ts";

/**
 * The member's config, running the load tier only.
 *
 * @example
 * // .stackra/vitest.load.config.ts (gen writes it)
 * import config from "./vitest.config";
 * export default loadTier(config);
 */
export function loadTier(config: UserConfig): UserConfig {
  return {
    ...config,
    test: {
      ...config.test,
      include: [...LOAD_TESTS],
      exclude: [...configDefaults.exclude],
      // A soak measures the box: a second file or a parallel test running beside it would halve the numbers.
      fileParallelism: false,
      maxConcurrency: 1,
      testTimeout: LOAD_TEST_TIMEOUT_MS,
      hookTimeout: LOAD_TEST_TIMEOUT_MS,
      // A load test that failed once failed: a retry would hide a capacity regression.
      retry: 0,
    },
  };
}
