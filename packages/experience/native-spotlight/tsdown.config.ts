/**
 * Stackra file contract:
 * Purpose: build config of @stackra/native-spotlight: one tsdown entry per package.json export (core `.` is `index`),
 *          each naming the stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339), and the
 *          config plugin (`plugin`, which `app.plugin.js` re-exports). Expo stays external as a peer; `ios/` and
 *          `android/` ship as source and autolinking compiles them in the app.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own entries
 *           over it, so gen keeps this file (ADR 0295 decision 5; STA-1306, STA-1299).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0478 (decision 7: the tarball carries the native folders).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`; a runtime URL, so a config bundler never resolves it early.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default {
  ...generated,
  ...library(
    {
      index: "src/core/index.ts",
      contracts: "src/contracts/index.ts",
      native: "src/native/index.ts",
      plugin: "plugin/src/index.ts",
    },
    { decorators: true },
  ),
};
