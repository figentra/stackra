/**
 * Stackra file contract:
 * Purpose: the member definition of @stackra/testing: static data that gen reads from the syntax tree without
 *          running it. The member key is derived from the folder name; there is no key option.
 * Boundary: data only; no function, no environment read and no import of the package's own code.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12); ADR 0269 (decision 2: `.` has no workspace
 *                     dependency).
 */

// shortcut: plain data, because the `.` entry may depend on no workspace package (ADR 0269 decision 2); switch to
// `definePackage({})` from @stackra/contracts if the owner accepts a dev-only edge for member definitions (STA-339).
export default {};
