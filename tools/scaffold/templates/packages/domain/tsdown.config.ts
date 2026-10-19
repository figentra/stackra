/**
 * Stackra file contract:
 * Purpose: build config of @stackra/{{NAME}} — one tsdown entry per package.json export. Workspace consumers
 *          read the source through `exports`; dist exists only for publishing.
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
