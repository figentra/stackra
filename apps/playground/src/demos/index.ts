/**
 * Stackra file contract:
 * Purpose: public surface of the web demos folder: the glob maps and the key function.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
export { DEMOS } from "./demos.constant";
export { demoPath } from "./demo-path.function";
