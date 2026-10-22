/**
 * Stackra file contract:
 * Purpose: build config of @figentra/worker-static — bundles `src/main.ts` (the site builder) into dist/main.mjs, which the
 *          `build` script then runs to write the static assets into dist/site.
 * Owner: the app owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

// Node built-ins stay imports: the preset builds for the neutral platform, where `node:*` cannot be resolved.
export default library({ main: "src/main.ts" }, { external: [/^node:/] });
