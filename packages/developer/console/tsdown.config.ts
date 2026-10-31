/**
 * Stackra file contract:
 * Purpose: build config of @stackra/console: one tsdown entry per package.json export (core `.` is `index`), each
 *          naming its entry's stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339), plus
 *          the `stackra-console` binary.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { library } from "@stackra/tsdown-config";

export default library(
  {
    index: "src/core/index.ts",
    contracts: "src/contracts/index.ts",
    node: "src/node/index.ts",
    testing: "src/testing/index.ts",
    "stackra-console": "src/node/stackra-console.ts",
  },
  // `node:` builtins stay imports; the shared preset targets the neutral platform, which would warn on each.
  { decorators: true, external: [/^node:/] },
);
