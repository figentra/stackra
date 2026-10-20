/**
 * Stackra file contract:
 * Purpose: build config of @stackra/{{NAME}} — one tsdown entry per package.json export (core `.` is `index`).
 *          Built to dist/*.mjs + .d.mts (ADR 0025); typecheck and tests read source through `@stackra/source`.
 * Owner: the package owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({ {{ENTRIES}} });
