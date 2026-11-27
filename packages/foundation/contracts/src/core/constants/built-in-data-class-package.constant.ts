/**
 * Stackra file contract:
 * Purpose: `BUILT_IN_DATA_CLASS_PACKAGE`, the package whose classes `BUILT_IN_DATA_CLASSES` describes. Gen reads a
 *          `@Classify` argument as built-in only when the declaration the checker resolves it to belongs to this
 *          package; a class of the same name anywhere else is a product class.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 7: built-in classes recognised by package).
 */

/** The package that ships the built-in data classes. */
export const BUILT_IN_DATA_CLASS_PACKAGE = "@stackra/model";
