/**
 * Stackra file contract:
 * Purpose: build config of @stackra/{{NAME}} — one tsdown entry per package.json export. Built to
 *          dist/*.mjs + .d.mts (ADR 0025); typecheck and tests read source through the `@stackra/source` condition.
 * Owner: the package owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library({
  index: "src/index.ts",
  core: "src/core/index.ts",
  application: "src/application/index.ts",
  infrastructure: "src/infrastructure/index.ts",
  "presentation/api": "src/presentation/api/index.ts",
});
