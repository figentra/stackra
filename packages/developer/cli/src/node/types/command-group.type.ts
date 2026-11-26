/**
 * Stackra file contract:
 * Purpose: `CommandGroup`, one heading of `stackra list` (`COMMAND_GROUPS`).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-001.
 */
import type { COMMAND_GROUPS } from "#node/constants/command-groups.constant";

/** A `stackra list` heading. */
export type CommandGroup = (typeof COMMAND_GROUPS)[number];
