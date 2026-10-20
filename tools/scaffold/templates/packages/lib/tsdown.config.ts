/**
 * Stackra file contract:
 * Purpose: build config of @stackra/{{NAME}} — the single `src/index.ts` entry. Built to dist/*.mjs + .d.mts
 *          (ADR 0025); typecheck and tests read the source through the `@stackra/source` export condition.
 * Owner: the package owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library();
