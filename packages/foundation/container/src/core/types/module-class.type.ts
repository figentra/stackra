/**
 * Stackra file contract:
 * Purpose: `ModuleClass`, the exported class type `Module({ ... })` returns and every module class fits, so a
 *          consumer's declaration emit can name it and `imports` refuses a class of another kind.
 * Boundary: a type only (ADR 0294 decision 25: each factory returns an exported, named class type).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rule 43).
 */
import type { Module } from "#core/bases/module.base";

/** A module class. */
export type ModuleClass = abstract new () => Module;
