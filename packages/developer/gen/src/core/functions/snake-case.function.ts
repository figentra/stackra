/**
 * Stackra file contract:
 * Purpose: `snakeCase`, the one name-to-code conversion behind every derived identity: a class, folder, field or
 *          verb name in PascalCase, camelCase, kebab-case or with spaces becomes snake_case.
 * Boundary: pure. Acronyms are cased as words by the naming standard (`ApiClient`), so no acronym splitting is done.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes, acronyms cased as words); ADR 0294 (decision 20).
 */

/**
 * The snake_case form of `name`.
 *
 * @example
 * snakeCase("OrderLine"); // "order_line"
 * snakeCase("loyalty-kit"); // "loyalty_kit"
 * snakeCase("attachImage"); // "attach_image"
 */
export function snakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s.]+/g, "_")
    .toLowerCase();
}
