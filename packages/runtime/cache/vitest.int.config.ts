/**
 * Stackra file contract:
 * Purpose: the integration tier of @stackra/cache: this member's own vitest config narrowed by `intTier` to the
 *          `.int.test.ts` files, which run the `valkey` driver against a real Valkey server in a Testcontainers
 *          container, so Docker is needed.
 * Boundary: test configuration only; `pnpm turbo run test:int` runs it through the `test:int` script. The `postgres`
 *           driver's real-server tests live in @stackra/database beside the migration that makes its tables.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); ADR 0150 (decision 1); ADR 0437 (Enforcement: the shared nonce store).
 */
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
