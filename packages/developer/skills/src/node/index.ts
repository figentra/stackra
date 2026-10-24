/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/skills until `stackra gen` writes the entry barrels
 *          (STA-339): the loader that reads a skill set from disk, by default the documents this package ships.
 * Boundary: names each re-export and declares nothing. Node only: it reads files. Imports `.` internals one way
 *           (ADR 0294 decision 15); exports none of `.`'s symbols.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0282 (decision 2).
 */
export { loadSkillSet } from "#node/functions/load-skill-set.function";
