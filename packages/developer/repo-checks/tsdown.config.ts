/**
 * Stackra file contract:
 * Purpose: build config of @stackra/repo-checks: one tsdown entry, `./node` (`dist/node.mjs`), which `stackra check`
 *          imports.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own entries
 *           (the barrels package.json `exports` names) and options over it, so gen keeps this file (ADR 0295
 *           decision 5; STA-1306, STA-1299). Before gen has run the package's own config builds alone.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0294 (decision 15: the `./node` entry).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`, and `build` does not wait for gen (the CLI that runs gen builds first).
// A runtime URL, so a config bundler never tries to resolve the file before gen has written it.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default { ...generated, ...library({ node: "src/node/index.ts" }) };
