/**
 * Stackra file contract:
 * Purpose: the integration tier of @stackra/media: this member's own vitest config narrowed by `intTier` to the
 *          `.int.test.ts` files, which run against a real tus server (tusd in a Testcontainers container, or the binary
 *          `TUSD_BINARY` names), so Docker or that binary is needed.
 * Boundary: test configuration only; `pnpm turbo run test:int` runs it through the `test:int` script.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-1570; ADR 0222 (decision 2: tus uploads); STA-669.
 */
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
