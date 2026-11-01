/**
 * Stackra file contract:
 * Purpose: `RECORD_PATH`, where `stackra eas-preflight record` appends one JSON line per local build (git-ignored,
 *          per machine), so a build id sits next to the rollout id that shipped it.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0180 (mobile builds and updates); ADR 0170 (deploy from a commit of main); STA-1577.
 */

/** The build record file, repository-relative. */
export const RECORD_PATH = ".stackra/releases/eas-builds.jsonl";
