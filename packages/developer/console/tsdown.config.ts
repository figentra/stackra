/**
 * Stackra file contract:
 * Purpose: build config of @stackra/console: one tsdown entry per package.json export (core `.` is `index`), each
 *          naming its entry's stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339), plus
 *          the `stackra-console` binary.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own entries
 *           and options over it, so gen keeps this file (ADR 0295 decision 5; STA-1306, STA-1299). Before gen has run
 *           the package's own config builds alone.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`; a runtime URL keeps the bundler from resolving it before then.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default {
  ...generated,
  ...library(
    {
      index: "src/core/index.ts",
      contracts: "src/contracts/index.ts",
      node: "src/node/index.ts",
      testing: "src/testing/index.ts",
      "stackra-console": "src/node/stackra-console.ts",
    },
    // `node:` builtins stay imports; the shared preset targets the neutral platform, which would warn on each.
    { decorators: true, external: [/^node:/] },
  ),
};
