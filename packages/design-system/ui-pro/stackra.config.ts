/**
 * Stackra file contract:
 * Purpose: the member definition of @stackra/ui-pro: static data that gen reads from the syntax tree without
 *          running it. The member key is derived from the package name; there is no key option.
 * Boundary: data only; no function, no environment read and no import of the package's own code.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12).
 */

// shortcut: plain data until @stackra/app ships definePackage (STA-339); then `export default definePackage({})`.
export default {};
