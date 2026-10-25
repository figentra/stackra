/**
 * Stackra file contract:
 * Purpose: `DataClassRef`, a data class as `@Classify` takes it and the readers of its effects see it: the class
 *          `DataClass({ ... })` returns, or a subclass of it, with its key and effects as statics.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 1 and 4).
 */
import type { DataClassOptions } from "#core/types/data-class-options.type";

/** A declared data class. */
export interface DataClassRef {
  /** The class's key and effects, frozen. */
  readonly dataClass: DataClassOptions;
}
