/**
 * Stackra file contract:
 * Purpose: build config of @figentra/console — bundles the single `src/main.ts` entry into dist/.
 * Boundary: build configuration only.
 * Runtime: node
 * Governing contract: ADR 0300 (published tooling presets).
 * Owner: the app owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({ main: "src/main.ts" });
