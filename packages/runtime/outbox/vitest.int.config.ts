/**
 * Stackra file contract:
 * Purpose: the integration tier of @stackra/outbox: this member's own vitest config narrowed by `intTier` to the
 *          `.int.test.ts` files: the cross-app relay end to end, on the Postgres the testbed's `--postgres` names
 *          (`TESTBED_POSTGRES_HOST`), skipped without it.
 * Boundary: test configuration only; `pnpm turbo run test:int` runs it through the `test:int` script.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-1570; ADR 0511 (STA-1910).
 */
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
