/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-receipt-printer: one tsdown entry per package.json export, `index` for the
 *          drivers and `plugin` for the config plugin `app.plugin.js` re-exports. `expo` stays external as a peer.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own
 *           entries and options over it, so gen keeps this file (ADR 0295 decision 5; STA-1306). Before gen has run the
 *           package's own config builds alone. The Swift
 *           and Kotlin are not built here: autolinking compiles them in the app's prebuild (ADR 0478 decision 2).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0127 2026-10-24 note (entries); ADR 0478.
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
    { index: "src/core/index.ts", plugin: "plugin/index.ts" },
    { external: [/^expo(\/|$)/] },
  ),
};
