/**
 * Stackra file contract:
 * Purpose: build config of @stackra/gen: one tsdown entry per package.json export (core `.` is `index`), each naming
 *          the stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0127 2026-10-24 note (the `./metro-transformer` tool hook).
 */
import { library } from "@stackra/tsdown-config";

export default library({
  index: "src/core/index.ts",
  node: "src/node/index.ts",
  testing: "src/testing/index.ts",
  "metro-transformer": "src/metro-transformer/index.ts",
});
