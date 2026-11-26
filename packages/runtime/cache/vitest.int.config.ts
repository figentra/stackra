/**
 * Stackra file contract:
 * Purpose: the integration tier of @stackra/cache: this member's own vitest config narrowed by `intTier` to the
 *          `.int.test.ts` files, which run its Valkey driver on a Testcontainers Valkey (`useValkey()`), so Docker is needed.
 * Boundary: test configuration only; `pnpm turbo run test:int` runs it through the `test:int` script.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-1570; STA-2802.
 */
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
