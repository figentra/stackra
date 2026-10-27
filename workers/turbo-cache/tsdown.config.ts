/**
 * Stackra file contract:
 * Purpose: build config of @figentra/worker-turbo-cache: bundles the Worker entry `src/main.ts` into dist/main.mjs,
 *          the script wrangler.jsonc deploys (tsdown resolves the `#src/*` subpath imports).
 * Boundary: build configuration only.
 * Runtime: node
 * Governing contract: ADR 0300 (published tooling presets).
 * Owner: the app owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({ main: "src/main.ts" });
