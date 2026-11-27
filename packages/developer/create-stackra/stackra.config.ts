/**
 * Stackra file contract:
 * Purpose: the member definition of create-stackra: static data that gen reads from the syntax tree without running
 *          it. The member key is derived from the package name; there is no key option.
 * Boundary: data only; no function, no environment read and no import of the package's own code. Plain data, not
 *           `definePackage`: the package installs from npmjs with no `@stackra/*` dependency, not even a dev one gen
 *           would need at build time.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12); ADR 0199 (amendment of 2026-11-27).
 */

export default {};
