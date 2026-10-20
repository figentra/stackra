/**
 * Stackra file contract:
 * Purpose: build config of @stackra/brand — the `.` and `./tokens` entries, built to dist/*.mjs + .d.mts (ADR 0025).
 *          Typecheck and tests read the source through the `@stackra/source` condition; runtimes load dist.
 * Owner: the package owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({ index: "src/index.ts", tokens: "src/tokens/tokens.ts" });
