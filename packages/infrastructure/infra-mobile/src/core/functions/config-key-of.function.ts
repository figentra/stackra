/**
 * Stackra file contract:
 * Purpose: `configKeyOf(value)`, the Pulumi stack config key a runway `ref:<path>` value resolves from: the first dot
 *          of the path becomes the namespace separator (`ref:expo.projectId` is `expo:projectId`); `null` for a
 *          literal, which a private product repository may inline.
 * Boundary: internal; the plan names the key in its owner tasks and the Pulumi slice reads it. Never reads config.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 4, as amended by 0289 decision 9: `ref:` values live in the stacks
 *                     repository's stack config).
 */

/**
 * The stack config key of a `ref:` value, or `null` for a literal.
 *
 * @param value - a runway fact.
 * @example
 * configKeyOf("ref:google.appSigningSha256"); // "google:appSigningSha256"
 * configKeyOf("acme"); // null
 */
export function configKeyOf(value: string): string | null {
  return value.startsWith("ref:") ? value.slice(4).replace(".", ":") : null;
}
