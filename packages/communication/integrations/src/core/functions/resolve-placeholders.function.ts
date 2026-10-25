/**
 * Stackra file contract:
 * Purpose: `resolvePlaceholders`, which fills each `{field}` of an `auth`, URL or webhook option from a lookup: the
 *          managed client passes one that reads the Connection first, then the Integration (ADR 0308 rule 4), and
 *          `@stackra/webhooks` passes one that reads only the side a URL verifies against.
 * Boundary: pure. A placeholder with no value throws a `TypeError` naming the field, never a value, so a missing
 *           secret surfaces as a configuration error and never as a request sent without its credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 4, 11 and 17).
 */

/** `{name}`, where the name is an identifier. */
const PLACEHOLDER = /\{([A-Za-z_$][\w$]*)\}/g;

/**
 * `template` with each `{name}` replaced by `lookup(name)`.
 *
 * @throws TypeError when `lookup` has no value for a placeholder.
 * @example
 * resolvePlaceholders("Bearer {apiKey}", (name) => fields[name]); // "Bearer re_..."
 */
export function resolvePlaceholders(
  template: string,
  lookup: (name: string) => string | undefined,
): string {
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    const value = lookup(name);
    if (value === undefined)
      throw new TypeError(`{${name}} has no value on the connection or the integration`);
    return value;
  });
}
