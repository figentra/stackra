/**
 * Stackra file contract:
 * Purpose: `DEV_INFRA_FILES`, where `stackra dev` writes the dev compose under a workspace root: the lane's Compose
 *          file, the one every lane shares, and the state file (the lane and the opt-ins started) a member's run reads
 *          to get the containers' variables.
 * Boundary: data only; paths relative to the workspace root, under the gitignored `.stackra/dev/` beside the dev
 *           facts. The state file holds names and a lane, never a value.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3); ADR 0295 (decision 5: generated files live in `.stackra/`); STA-2664
 *                     (item 6).
 */

/** The dev compose files. */
export const DEV_INFRA_FILES = {
  /** The lane's own containers. */
  lane: ".stackra/dev/compose.yaml",
  /** The containers every lane shares (`perLane: false`). */
  shared: ".stackra/dev/compose.shared.yaml",
  /** The lane and opt-ins the last `stackra dev` started. */
  state: ".stackra/dev/infra.json",
} as const;
