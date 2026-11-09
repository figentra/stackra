/**
 * Stackra file contract:
 * Purpose: `LaunchConfig`, the whole `.claude/launch.json` document.
 * Boundary: type only; the shape is Claude Code's.
 * Runtime: node
 * Governing contract: STA-2081.
 */
import type { LaunchConfiguration } from "#node/launch-config/types/launch-configuration.type";

/** Claude Code's launch file. */
export type LaunchConfig = {
  /** The file format version Claude reads. */
  readonly version: "0.0.1";

  /** The servers, surfaces first, then members by folder. */
  readonly configurations: readonly LaunchConfiguration[];
};
