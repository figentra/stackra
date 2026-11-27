/**
 * Stackra file contract:
 * Purpose: `OptionSetClass`, the class `@Options(...)` takes: an `OptionSet` built with no arguments.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-2924 spec FR-001.
 */
import type { OptionSet } from "#core/bases/option-set.base";

/** An option set class. */
export type OptionSetClass = new () => OptionSet;
