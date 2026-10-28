/**
 * Stackra file contract:
 * Purpose: `snakeCase`, the one name-to-code conversion behind every derived identity: a class, folder, field or verb
 *          name in PascalCase, camelCase, kebab-case, dotted or with spaces becomes snake_case.
 * Boundary: public and pure; ASCII names. Digits stay with the word before them (`Column1` is `column1`). Acronyms are
 *           cased as words by the naming standard (`ApiClient`); an all-capitals run that still appears is one word
 *           (`HTTPServer` is `http_server`).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0231 (snake_case machine codes, acronyms as words);
 *                     ADR 0294 (decision 20); stackra-224 (one copy, was gen and panel).
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
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replaceAll(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .replaceAll(/[-\s.]+/g, "_")
    .toLowerCase();
}
