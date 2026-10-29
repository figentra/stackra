/**
 * Stackra file contract:
 * Purpose: `intTier(config)`, which narrows a member's own vitest config to the integration tier (`INT_TESTS`), so
 *          `test:int` keeps the member's preset, aliases and generated setup and runs only the `.int.test.ts` files.
 * Boundary: returns a new config; it runs no tests. Replaces `include` and `exclude` outright (mergeConfig would
 *           concatenate the unit tier's exclude of `*.int.test.ts`). A config built from `projects` is not narrowed.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 1: test tiers); ADR 0022 (test placement); STA-1570.
 */
import { configDefaults, type ViteUserConfig as UserConfig } from "vitest/config";

import { INT_TESTS } from "../constants/int-tests.constant.ts";

/**
 * The member's config, running the integration tier only.
 *
 * @example
 * // vitest.int.config.ts
 * import config from "./vitest.config";
 * export default intTier(config);
 */
export function intTier(config: UserConfig): UserConfig {
  return {
    ...config,
    test: {
      ...config.test,
      include: [...INT_TESTS],
      exclude: [...configDefaults.exclude],
      // One Postgres container per file: files run one after another so image builds and boots do not starve CI.
      fileParallelism: false,
    },
  };
}
