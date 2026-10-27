/**
 * Stackra file contract:
 * Purpose: build config of @stackra/peripherals: one tsdown entry per package.json export (core `.` is `index`; `native`
 *          is the Android till drivers of ADR 0442), each
 *          naming the stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339). Electron
 *          stays external as an optional peer.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0127 2026-10-24 note (entries).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({
  index: "src/core/index.ts",
  contracts: "src/contracts/index.ts",
  desktop: "src/desktop/index.ts",
  native: "src/native/index.ts",
});
