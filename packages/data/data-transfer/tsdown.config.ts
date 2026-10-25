/**
 * Stackra file contract:
 * Purpose: build config of @stackra/data-transfer: one tsdown entry per package.json export (core `.` is `index`),
 *          each naming the stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339).
 *          `exceljs` stays external as a dependency.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({ index: "src/core/index.ts", contracts: "src/contracts/index.ts" });
