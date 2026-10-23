/**
 * Stackra file contract:
 * Purpose: build config of @stackra/ui-pro: one tsdown entry per package.json export (core `.` is `index`).
 *          `./contracts`, `./react` and `./native` name stand-in barrels until gen writes the entry barrels (ADR 0294
 *          decision 15, STA-339). The peer dependencies (React, HeroUI, HeroUI Pro, HeroUI Native, HeroUI Native Pro,
 *          Uniwind, React Native) stay external, so no HeroUI Pro code is ever bundled into `dist/`.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators); ADR 0304 (private package).
 */
import { library } from "@stackra/tsdown-config";

export default library(
  {
    index: "src/config/ui-pro.config.ts",
    contracts: "src/contracts/index.ts",
    node: "src/node/ui-pro.module.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
  },
  { decorators: true },
);
