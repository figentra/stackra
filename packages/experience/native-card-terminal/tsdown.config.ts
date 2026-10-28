/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-card-terminal: one tsdown entry per package.json export (`contracts`,
 *          `native`), each naming the stand-in barrel until gen writes the entry barrels, plus `plugin`, the Expo
 *          config plugin `app.plugin.js` loads at prebuild. `expo` stays external as a peer.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5). The Swift
 *           and Kotlin are not built here: autolinking builds them in the app at prebuild (ADR 0478 decision 2).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0478 (decisions 2 and 7).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library(
  {
    contracts: "src/contracts/index.ts",
    native: "src/native/index.ts",
    plugin: "plugin/index.ts",
  },
  { external: [/^expo(\/|$)/] },
);
