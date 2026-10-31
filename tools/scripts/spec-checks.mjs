/**
 * Stackra file contract:
 * Purpose: `checks`, the spec checks of @stackra/repo-checks (the `spec-*` functions and constants) loaded from source,
 *          for spec-parse, spec-gate and spec-trace (STA-1669).
 * Boundary: imports only the `spec-*` source files, which import only each other, so a spec script (and the plan-gate
 *           hook that loads spec-gate on every source write) never pulls the package barrel or its TypeScript compiler
 *           dependency, and runs without `pnpm install`. Plain Node strips the types (ADR 0421 decision 2).
 * Runtime: node
 * Governing contract: ADR 0120; ADR 0421; STA-1669.
 */
const SOURCE = "../../packages/developer/repo-checks/src/node";

/** The spec functions, by file stem (`spec-check-stage` exports `specCheckStage`). */
const FUNCTIONS = [
  "spec-at-least",
  "spec-check-bug",
  "spec-check-clarified",
  "spec-check-foreign-status",
  "spec-check-lane",
  "spec-check-plan",
  "spec-check-stage",
  "spec-check-tasks",
  "spec-covers-tags",
  "spec-defined-ids",
  "spec-defined-lines",
  "spec-drift",
  "spec-folder-of",
  "spec-folder-shape",
  "spec-impact-of",
  "spec-is-own",
  "spec-key-pattern",
  "spec-member-of",
  "spec-parse-tasks",
  "spec-prefixes-of",
  "spec-properties",
  "spec-refs-keys",
  "spec-routes",
  "spec-status-line",
  "spec-status-of",
  "spec-strip",
  "spec-trace-problems",
  "spec-trace",
];

/** The spec constants, by file stem. */
const CONSTANTS = ["spec-dir", "spec-folder", "spec-impact-fields", "spec-stages", "spec-statuses"];

const load = (kind) => (stem) =>
  import(new URL(`${SOURCE}/${kind}s/${stem}.${kind}.ts`, import.meta.url).href);

/** Every export of the spec function and constant files, as one namespace object. */
export const checks = Object.assign(
  {},
  ...(await Promise.all([...FUNCTIONS.map(load("function")), ...CONSTANTS.map(load("constant"))])),
);
