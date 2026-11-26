/**
 * Stackra file contract:
 * Purpose: the integration tier of @stackra/logger: this member's own vitest config narrowed by `intTier` to the
 *          `.int.test.ts` files (the OTLP drivers against a real OpenTelemetry Collector in Testcontainers).
 * Boundary: test configuration only; `pnpm turbo run test:int` runs it through the `test:int` script. Needs Docker.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); ADR 0184 (decision 1); STA-2854.
 */
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
