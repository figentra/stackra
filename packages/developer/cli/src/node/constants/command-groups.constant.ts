/**
 * Stackra file contract:
 * Purpose: `COMMAND_GROUPS`, the headings of `stackra list` in the order a developer meets them: Create (a new app,
 *          member or registry item), Develop (generate, serve, build), Inspect (the machine, the manifest, a running
 *          environment's state), Database (migrations, seeds and data jobs), Quality (the checks and tests), Deploy
 *          (ship, promote and release), and Repository (the Stackra core repository's own checks, listed only there).
 * Boundary: data only; every command names one of them as its `group` (pinned by the commands test).
 * Runtime: node
 * Governing contract: STA-2872 spec FR-001 and FR-002; ADR 0282 (decision 3).
 */

/** The `stackra list` headings, in order. */
export const COMMAND_GROUPS = [
  "Create",
  "Develop",
  "Inspect",
  "Database",
  "Quality",
  "Deploy",
  "Repository",
] as const;
