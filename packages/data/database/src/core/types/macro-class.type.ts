/**
 * Stackra file contract:
 * Purpose: `MacroClass`, a concrete macro class, as `compileMigration` takes the macros a member may call.
 * Boundary: a type only; a macro has no constructor parameters.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros).
 */
import type { Macro } from "#core/bases/macro.base";

/** A macro class. */
export type MacroClass = new () => Macro;
