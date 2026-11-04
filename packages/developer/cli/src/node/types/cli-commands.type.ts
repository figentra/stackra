/**
 * Stackra file contract:
 * Purpose: `CliCommands`, the list `stackra` runs: native `@stackra/console` command classes and the `CliCommand`s not
 *          yet ported (each runs as a passthrough command until it becomes a class).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0506; ADR 0500 (decision 7); STA-1966.
 */
import type { CommandClass } from "@stackra/console";

import type { CliCommand } from "#node/types/cli-command.type";

/** Native commands and legacy ones, in help order. */
export type CliCommands = readonly (CommandClass | CliCommand)[];
