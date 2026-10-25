/**
 * Stackra file contract:
 * Purpose: a kebab-case theme name for a layer whose id is not one (ADR 0340 decision 2): a tenant's public id
 *          (`ten_01HZ…`) becomes `ten-01hz…`, so the resolved theme passes `defineTheme`'s name rule.
 * Boundary: pure; lower-cases, turns every run of other characters into one hyphen and trims them; an id that leaves
 *           nothing, or begins with a digit, is prefixed `layer-`.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 2); ADR 0231 (kebab-case token names).
 */

/**
 * The theme name for a layer id.
 * @param id - any string
 * @returns a kebab-case name
 */
export function themeNameOf(id: string): string {
  const name = id
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  return name === "" || /^\d/.test(name) ? `layer-${name}`.replace(/-$/, "") : name;
}
