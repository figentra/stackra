/**
 * Stackra file contract:
 * Purpose: `CommandClass`, the class of one command: what a registry lists and what `Command({ ... })` returns to
 *          extend.
 * Boundary: a type only. The constructor takes the command's collaborators; `never[]` accepts a class whatever its
 *           parameters, since the kernel builds a command through the container or with no arguments.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-001 and FR-006.
 */
import type { Command } from "#core/bases/command.base";

/** A command class, whatever its collaborators. */
export type CommandClass = abstract new (...collaborators: never[]) => Command;
