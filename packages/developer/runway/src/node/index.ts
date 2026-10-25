/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/runway until `stackra gen` writes the entry barrels
 *          (STA-339): the build-time helpers the generated Vite configs import (`definesFor`, `devServer`, folded in
 *          from the old `./vite` entry, owner Q4) and the runway file reader.
 * Boundary: names each re-export and declares nothing. Node only: it reads files. Imports `.` internals one way
 *           (ADR 0294 decision 15); exports none of `.`'s symbols.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { definesFor } from "#node/functions/defines-for.function";
export { devServer } from "#node/functions/dev-server.function";
export { readRunway } from "#node/functions/read-runway.function";
export type { DevServerOptions } from "#node/types/dev-server-options.type";
