/**
 * Stackra file contract:
 * Purpose: the integration tier of @stackra/infra-observability: this member's own vitest config narrowed by `intTier` to the
 *          `.int.test.ts` files (the objectives' Prometheus rules under `promtool test rules` of a real
 *          Prometheus in Testcontainers).
 * Boundary: test configuration only; `pnpm turbo run test:int` runs it through the `test:int` script. Needs Docker,
 *           or the pinned release binaries named by `STACKRA_OTELCOL_BIN` and `STACKRA_PROMETHEUS_DIR`.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); ADR 0184 (decisions 2 and 3); STA-2854.
 */
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
