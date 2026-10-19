/**
 * Stackra file contract:
 * Purpose: build config of @figentra/service-example — bundles the single `src/main.ts` entry into dist/.
 * Owner: the service owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({ main: "src/main.ts" });
