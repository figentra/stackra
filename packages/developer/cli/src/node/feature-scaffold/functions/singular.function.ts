/**
 * Stackra file contract:
 * Purpose: `singular(name)`, the singular of the last word of a kebab-case module key, for the first model of
 *          `stackra new module` (`orders` to `order`, `price-lists` to `price-list`, `categories` to `category`,
 *          `addresses` to `address`).
 * Boundary: pure; regular English rules, the inverse of gen's `plural`. A key whose model is irregular takes
 *           `--model`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: plural tables of singular models).
 */

/**
 * The singular of `name`'s last word.
 *
 * @example
 * singular("price-lists"); // "price-list"
 * singular("categories"); // "category"
 * singular("addresses"); // "address"
 * singular("billing"); // "billing"
 */
export function singular(name: string): string {
  if (/[^aeiou]ies$/.test(name)) return `${name.slice(0, -3)}y`;
  if (/(ss|x|z|ch|sh)es$/.test(name)) return name.slice(0, -2);
  if (/[^su]s$/.test(name)) return name.slice(0, -1);
  return name;
}
