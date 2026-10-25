/**
 * Stackra file contract:
 * Purpose: build config of @stackra/cli: one tsdown entry, the `stackra` binary (`dist/stackra.mjs`, the package.json
 *          `bin`). The package has no code entry: nothing imports it, it is run.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0083 (the `stackra` binary).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({ stackra: "src/node/stackra.ts" });
