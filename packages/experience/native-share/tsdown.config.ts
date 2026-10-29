/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-share: the `.`, `./contracts`, `./native` and `./react` entries and the
 *          config plugin (`plugin`, which `app.plugin.js` re-exports for Expo CLI at prebuild).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5). There is
 *           no Swift or Kotlin: expo-sharing ships the share extension and the share target (ADR 0478 decision 2).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0478 (decisions 2 and 7).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({
  index: "src/core/index.ts",
  contracts: "src/contracts/index.ts",
  native: "src/native/index.ts",
  react: "src/react/index.ts",
  plugin: "plugin/src/index.ts",
});
