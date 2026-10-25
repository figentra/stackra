/**
 * Stackra file contract:
 * Purpose: `FlagClass`, the class `Flag({...})` returns and an author extends (`class HelpCentreFlag extends
 *          Flag({ default: false }) {}`).
 * Boundary: a type only, one construct signature, so the declaration emit of an author's flag names an exported type
 *           (ADR 0305 rule 43). Nobody constructs a flag: the class is read for its options by `flagRefs` and gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0305 (rule 43).
 */
import type { Flag } from "#core/bases/flag.base";

/** A flag class. */
export type FlagClass = new () => Flag;
