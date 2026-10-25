/**
 * Stackra file contract:
 * Purpose: `snakeCase`, a PascalCase or camelCase name as a snake_case code (`SalesOverview` is `sales_overview`).
 * Boundary: internal: pure; no entry exports it. Digits stay with the word before them (`Column1` is `column1`).
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 20: derived identities).
 */

/**
 * The snake_case form of `name`.
 *
 * @example
 * snakeCase("SalesOverview"); // "sales_overview"
 */
export function snakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}
