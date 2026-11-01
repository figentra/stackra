/**
 * Stackra file contract:
 * Purpose: `CommandEntry`, one row of a registry: the command class and its structure.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006.
 */
import type { CommandClass } from "#core/types/command-class.type";
import type { CommandStructure } from "#core/types/command-structure.type";

/** A registered command. */
export interface CommandEntry {
  /** The class the kernel resolves or builds. */
  readonly type: CommandClass;

  /** What `readCommand` read from it. */
  readonly structure: CommandStructure;
}
