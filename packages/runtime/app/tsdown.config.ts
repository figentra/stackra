/**
 * Stackra file contract:
 * Purpose: build config of @stackra/app: one tsdown entry per package.json export (core `.` is `index`), each naming
 *          the stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0127 2026-10-24 note (runtime-target entries).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({
  index: "src/core/index.ts",
  react: "src/react/index.ts",
  server: "src/server/index.ts",
  worker: "src/worker/index.ts",
  browser: "src/browser/index.ts",
  native: "src/native/index.ts",
  electron: "src/electron/index.ts",
});
