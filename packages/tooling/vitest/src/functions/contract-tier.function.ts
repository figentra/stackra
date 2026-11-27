/**
 * Stackra file contract:
 * Purpose: `contractTier(config)`, which narrows a member's own vitest config to the contract tier (`CONTRACT_TESTS`),
 *          so `test:contract` keeps the member's preset, aliases and generated setup and runs only the
 *          `.contract.test.ts` files.
 * Boundary: returns a new config; it runs no tests. Replaces `include` and `exclude` outright (mergeConfig would
 *           concatenate the unit tier's exclude of `*.contract.test.ts`). A config built from `projects` is not
 *           narrowed. Files keep running in parallel: a contract test reads files and runs local tools, no container.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the contract tier); ADR 0022 (test placement); STA-2837.
 */
import { configDefaults, type ViteUserConfig as UserConfig } from "vitest/config";

import { CONTRACT_TESTS } from "../constants/contract-tests.constant.ts";

/**
 * The member's config, running the contract tier only.
 *
 * @example
 * // vitest.contract.config.ts
 * import config from "./vitest.config";
 * export default contractTier(config);
 */
export function contractTier(config: UserConfig): UserConfig {
  return {
    ...config,
    test: {
      ...config.test,
      include: [...CONTRACT_TESTS],
      exclude: [...configDefaults.exclude],
    },
  };
}
