/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-cash-drawer: one tsdown entry per package.json export, `index` for the
 *          drivers and `plugin` for the config plugin `app.plugin.js` re-exports. `expo` stays external as a peer.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5). The Swift
 *           and Kotlin are not built here: autolinking compiles them in the app's prebuild (ADR 0478 decision 2).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0127 2026-10-24 note (entries); ADR 0478.
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library(
  { index: "src/core/index.ts", plugin: "plugin/index.ts" },
  { external: [/^expo(\/|$)/] },
);
