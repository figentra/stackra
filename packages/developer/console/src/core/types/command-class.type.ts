/**
 * Stackra file contract:
 * Purpose: `CommandClass`, the class of one command: what a registry lists and what `Command({ ... })` returns to
 *          extend.
 * Boundary: a type only. The constructor takes the command's collaborators, so a registry types it as taking any.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-001 and FR-006.
 */
import type { Command } from "#core/bases/command.base";

/** A command class, whatever its collaborators. */
// oxlint-disable-next-line typescript/no-explicit-any -- reason: a registry holds commands of any constructor
export type CommandClass = abstract new (...collaborators: any[]) => Command;
