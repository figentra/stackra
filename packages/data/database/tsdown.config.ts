/**
 * Stackra file contract:
 * Purpose: build config of @stackra/database: one tsdown entry per package.json export (core `.` is `index`), each
 *          naming the stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339).
 *          @stackra/testing, Faker, Testcontainers and PGlite stay external as optional peers of `./testing`.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output).
 */
import { library } from "@stackra/tsdown-config";

export default library({
  index: "src/core/index.ts",
  contracts: "src/contracts/index.ts",
  node: "src/node/index.ts",
  testing: "src/testing/index.ts",
});
