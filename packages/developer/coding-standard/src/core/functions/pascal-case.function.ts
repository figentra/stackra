/**
 * Stackra file contract:
 * Purpose: `pascalCase`, a kebab-case kind suffix in PascalCase (`extension-point` is `ExtensionPoint`), the name of
 *          the kind's base class and of its class-name suffix.
 * Boundary: pure string work; kebab-case input only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rules R2 and R3: the base is `PascalCase(kind)`); ADR 0305 (rule 3).
 */

/**
 * Converts a kebab-case word list to PascalCase.
 *
 * @example
 * ```ts
 * pascalCase("state-machine"); // "StateMachine"
 * ```
 */
export function pascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
