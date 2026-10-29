/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-card-terminal: one tsdown entry per package.json export (`contracts`,
 *          `native`), each naming the stand-in barrel until gen writes the entry barrels, plus `plugin`, the Expo
 *          config plugin `app.plugin.js` loads at prebuild. `expo` stays external as a peer.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own
 *           entries and options over it, so gen keeps this file (ADR 0295 decision 5; STA-1306). Before gen has run the
 *           package's own config builds alone. The Swift
 *           and Kotlin are not built here: autolinking builds them in the app at prebuild (ADR 0478 decision 2).
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
  ...library(
    {
      contracts: "src/contracts/index.ts",
      native: "src/native/index.ts",
      plugin: "plugin/index.ts",
    },
    { external: [/^expo(\/|$)/] },
  ),
};
