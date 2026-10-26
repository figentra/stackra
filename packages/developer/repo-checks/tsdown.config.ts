/**
 * Stackra file contract:
 * Purpose: build config of @stackra/repo-checks: one tsdown entry, `./node` (`dist/node.mjs`), which `stackra check`
 *          imports.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0294 (decision 15: the `./node` entry).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({ node: "src/node/index.ts" });
