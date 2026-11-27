/**
 * Stackra file contract:
 * Purpose: build config of create-stackra: one tsdown entry, the `create-stackra` binary (`dist/create-stackra.mjs`,
 *          the package.json `bin`), bundled with no dependency so `npm create stackra` installs nothing else. The
 *          package has no code entry: nothing imports it, it is run.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own entry over
 *           it, so gen keeps this file (ADR 0295 decision 5; STA-1306, STA-1299). Before gen has run the package's own
 *           config builds alone.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0199 (amendment of 2026-11-27).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`, and `build` does not wait for gen (the CLI that runs gen builds first).
// A runtime URL, so a config bundler never tries to resolve the file before gen has written it.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default { ...generated, ...library({ "create-stackra": "src/node/create-stackra.ts" }) };
