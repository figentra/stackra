/**
 * Stackra file contract:
 * Purpose: `EdiElement`, one data element of an EDI segment: a simple value, or the components of a composite.
 * Boundary: a type only. Values are unescaped; the writer adds the EDIFACT release character and refuses an X12 value
 *           that holds a delimiter.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */

/** A simple element, or a composite's components in order. */
export type EdiElement = string | readonly string[];
