/**
 * Stackra file contract:
 * Purpose: build config of @stackra/navigation: one tsdown entry per package.json export (core `.` is `index`), each
 *          naming its entry's one public file; `.`/`./contracts`/`./react`/`./native` name stand-in barrels until gen
 *          writes the entry barrels (ADR 0294 decision 15, STA-339).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { library } from "@stackra/tsdown-config";

export default library(
  {
    index: "src/config/navigation.config.ts",
    contracts: "src/contracts/index.ts",
    node: "src/node/navigation.module.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
  },
  { decorators: true },
);
