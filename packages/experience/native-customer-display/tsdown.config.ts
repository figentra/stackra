/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-customer-display: the `.` entry (`index`, the `external` driver) and the
 *          config plugin (`plugin`, which `app.plugin.js` re-exports for Expo CLI at prebuild).
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own
 *           entries and options over it, so gen keeps this file (ADR 0295 decision 5; STA-1306). Before gen has run,
 *           the package's own config builds alone. The Swift and Kotlin under `ios/` and `android/` are not built
 *           here: autolinking compiles them in the app.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0478 (decisions 2 and 7).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`, and `build` does not wait for gen (the CLI that runs gen builds first).
// A runtime URL, so a config bundler never tries to resolve the file before gen has written it.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default {
  ...generated,
  ...library({
    index: "src/core/index.ts",
    plugin: "plugin/src/index.ts",
  }),
};
