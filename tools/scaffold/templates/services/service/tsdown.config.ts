/**
 * Stackra file contract:
 * Purpose: build config of @figentra/service-{{NAME}} — `src/main.ts` (the process entry) and the types-only
 *          `./contracts` entry, legacy decorators on (ADR 0005). Built to dist/*.mjs + .d.mts (ADR 0025); the
 *          Encore app `stackra gen` writes to `.stackra/encore` imports the built service (ADR 0091).
 * Owner: the service owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library(
  { main: "src/main.ts", contracts: "src/contracts/index.ts" },
  { decorators: true },
);
