/**
 * Stackra file contract:
 * Purpose: build config of @stackra/showcase: one tsdown entry for `.`. The JSON under `api/`, `search/` and
 *          `assets/` is exported as files, not bundled.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output).
 */
import { library } from "@stackra/tsdown-config";

export default library({ index: "src/index.ts" });
