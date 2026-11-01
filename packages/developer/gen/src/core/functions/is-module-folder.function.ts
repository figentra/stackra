/**
 * Stackra file contract:
 * Purpose: `isModuleFolder`, whether a folder under a service's `src/modules/` is a feature module: its name starts with
 *          a lowercase letter, as a module key does. A test, mock or fixture folder (`__tests__`, `__mocks__`) and a
 *          dot folder are not, so gen never writes a `_Tests__Module` or keys anything by them (STA-1696).
 * Boundary: pure; the name only, not the path.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 13: a module is its folder; derived keys); ADR 0022 (tests in `__tests__`).
 */

/**
 * Whether the folder `name` is a feature module.
 *
 * @example
 * isModuleFolder("price-lists"); // true
 * isModuleFolder("__tests__"); // false
 */
export function isModuleFolder(name: string): boolean {
  return /^[a-z]/.test(name);
}
