/**
 * Stackra file contract:
 * Purpose: `kebabCase`, an identifier in kebab-case, so a rule can derive the file name an export must live in
 *          (`useRunShortcut` lives in `use-run-shortcut.ts`).
 * Boundary: pure string work; ASCII identifiers only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (naming and casing, files are kebab-case); ADR 0305 (one declaration per file).
 */

/**
 * Converts a camelCase or PascalCase identifier to kebab-case. An acronym run stays one word (`loadHTTPUrl` is
 * `load-http-url`), as ADR 0231 cases acronyms as words.
 *
 * @example
 * ```ts
 * kebabCase("useRunShortcut"); // "use-run-shortcut"
 * ```
 */
export function kebabCase(identifier: string): string {
  return identifier
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}
