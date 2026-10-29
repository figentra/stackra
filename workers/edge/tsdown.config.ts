/**
 * Stackra file contract:
 * Purpose: build config of @figentra/worker-edge — bundles the Worker entry `src/main.ts` into dist/main.mjs, the script
 *          wrangler.jsonc deploys (wrangler uploads the bundle as is).
 * Boundary: build configuration only. `@stackra/app` and `@stackra/contracts` are devDependencies, so tsdown bundles
 *           what the Worker imports from them (`signEdgeRequest`, `verifyBearerToken`, `jwksKeySource`, `EdgeHeader`).
 * Runtime: node
 * Governing contract: ADR 0300 (published tooling presets); ADR 0437.
 * Owner: the app owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

// The neutral platform fits the Workers runtime; the source imports no `node:*` module.
export default library({ main: "src/main.ts" });
