/**
 * Stackra file contract:
 * Purpose: the parsers for spec-kit artifacts shared by spec-gate and spec-trace (spec.md, plan.md, tasks.md,
 *   `.agents/routing.yaml` task types, `@covers` tags in tests), as core calls them: the published `spec-*` functions of
 *   the repo-checks package, with core's issue prefix `sta` and bare issue numbers ("163") applied.
 * Boundary: pure functions over text; no file or network access.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0121; ADR 0282 (decision 3).
 * Secrets: none.
 */
import { checks } from "./spec-checks.mjs";

/** Text without HTML comments, which hold template guidance, never content. */
export const strip = checks.specStrip;

/** IDs defined as `- **FR-001**: …` (or SC/EC/P), split into live and struck (`~~FR-001~~`, amendments). */
export const definedIds = checks.specDefinedIds;

/** `- **FR-001**: rest` → Map(id → rest), struck or not. */
export const definedLines = checks.specDefinedLines;

/** Task lines of tasks.md, with their phase heading. */
export const parseTasks = (text) => checks.specParseTasks(text, ["sta"]);

/** `P-001 … Validates: FR-001, FR-003` lines of plan.md → Map(P → [FR]). */
export const properties = checks.specProperties;

/** Task types under `tasks:` in `.agents/routing.yaml`. */
export const routes = checks.specRoutes;

/** `@covers sta-163:FR-001 sta-163:P-002` tags in a test file → the IDs for spec `key` (`163`). */
export const coversTags = (text, key) => checks.specCoversTags(text, `sta-${key}`);

/** Path prefixes of workspace members a repo path belongs to (packages/<cat>/<name>, apps/<n>, services/<n>). */
export const memberOf = checks.specMemberOf;
