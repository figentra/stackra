/**
 * Stackra file contract:
 * Purpose: `CommandOption`, an action's or query's `command` option: the console command name, or the name with the
 *          group it is listed under.
 * Boundary: a type only. Off when absent; it never makes the action an AI tool (`tool` is its own option). Gen reads
 *           it and writes the command class (`ActionCommand`); the name follows the console's `COMMAND_NAME` rule
 *           (`[a-z0-9-]` segments joined by `:`).
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-022; ADR 0506 (amendment of 2026-11-02, point 7); ADR 0305 (rule 28).
 */

/** A console command name, or a name and group. */
export type CommandOption = string | { readonly name: string; readonly group?: string };
