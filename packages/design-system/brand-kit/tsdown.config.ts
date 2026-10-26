/**
 * Stackra file contract:
 * Purpose: build config of @stackra/brand-kit: one tsdown entry per package.json export (core `.` is `index`) and the
 *          `brand-kit` binary (`dist/brand-kit.mjs`, the package.json `bin`). The entries name stand-in barrels until
 *          gen writes the entry barrels (ADR 0294 decision 15, STA-339).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0441 (decision 5: the CLI Runway runs).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({
  index: "src/core/index.ts",
  contracts: "src/contracts/index.ts",
  node: "src/node/index.ts",
  "brand-kit": "src/node/brand-kit.ts",
});
