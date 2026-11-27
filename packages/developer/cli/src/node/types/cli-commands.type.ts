/**
 * Stackra file contract:
 * Purpose: `CliCommands`, the list `stackra` runs: native `@stackra/console` command classes, in help order.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0506; ADR 0500 (decision 7); STA-1966; STA-2883.
 */
import type { CommandClass } from "@stackra/console";

/** The command classes, in help order. */
export type CliCommands = readonly CommandClass[];
