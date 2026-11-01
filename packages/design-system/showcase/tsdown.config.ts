/**
 * Stackra file contract:
 * Purpose: build config of @stackra/showcase: one tsdown entry for `.`. The JSON under `api/`, `search/` and
 *          `assets/` is exported as files, not bundled.
 * Boundary: build configuration only; merged over the config gen writes into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`; a runtime URL, so a config bundler never resolves it before gen ran.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default { ...generated, ...library({ index: "src/index.ts" }) };
