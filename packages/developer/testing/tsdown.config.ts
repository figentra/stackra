/**
 * Stackra file contract:
 * Purpose: build config of @stackra/testing: one tsdown entry per package.json export (core `.` is `index`). `.`
 *          names a stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339). vitest is a
 *          peer dependency, so tsdown leaves it external and the consumer's own instance is the one re-exported.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0269 (decision 2).
 */
import { library } from "@stackra/tsdown-config";

export default library({ index: "src/core/index.ts" });
