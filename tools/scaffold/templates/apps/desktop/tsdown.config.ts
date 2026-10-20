/**
 * Stackra file contract:
 * Purpose: build config of @figentra/{{NAME}} — the Electron main process (`src/main.ts`) to dist/main.mjs.
 *          `electron` is provided by the runtime, so it stays external.
 * Owner: the app owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({ main: "src/main.ts" }, { external: ["electron"] });
