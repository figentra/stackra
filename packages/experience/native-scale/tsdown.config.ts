/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-scale: the `.` entry (`index`, the drivers and the configuration) and the
 *          config plugin (`plugin`, which `app.plugin.js` re-exports for Expo CLI at prebuild).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5). The Swift
 *           and Kotlin under `ios/` and `android/` are not built here: autolinking compiles them in the app.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0478 (decisions 2 and 7).
 */
import { library } from "@stackra/tsdown-config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default library({
  index: "src/core/index.ts",
  plugin: "plugin/src/index.ts",
});
