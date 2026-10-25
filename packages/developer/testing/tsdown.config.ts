/**
 * Stackra file contract:
 * Purpose: build config of @stackra/testing: one tsdown entry per package.json export (core `.` is `index`). Each
 *          names a stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339). vitest, React,
 *          React Native and the Testing Library packages are peer dependencies, so tsdown leaves them external and the
 *          consumer's own instances are the ones re-exported.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0269 (decisions 2 and 6).
 */
import { library } from "@stackra/tsdown-config";

export default library({
  index: "src/core/index.ts",
  react: "src/react/index.ts",
  native: "src/native/index.ts",
});
