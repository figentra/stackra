/**
 * Stackra file contract:
 * Purpose: `LAUNCH_FILE`, the dev-server list Claude Code's preview tools read: `.claude/launch.json`, relative to the
 *          repository root. `stackra gen` writes it from the runways and `stackra validate --repository` refuses drift.
 * Boundary: a path only. Claude reads this fixed name, so it stays strict `.json` (`MUST_STAY_JSON`) and is committed:
 *           a session opens in a fresh worktree before any gen has run (ADR 0295, amendment of 2026-11-03).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5, amendment of 2026-11-03); ADR 0296 (decision 1); STA-2081.
 */

/** The launch file, relative to the repository root. */
export const LAUNCH_FILE = ".claude/launch.json";
