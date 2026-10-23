/**
 * Stackra file contract:
 * Purpose: build config of @stackra/ui: one tsdown entry per package.json export (core `.` is `index`), each
 *          naming its entry's one public file until gen writes the entry barrels (ADR 0294 decision 15, STA-339).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { library } from "@stackra/tsdown-config";

export default library(
  { index: "src/config/ui.config.ts", node: "src/node/ui.module.ts" },
  { decorators: true },
);
