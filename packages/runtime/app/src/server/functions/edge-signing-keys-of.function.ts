/**
 * Stackra file contract:
 * Purpose: `edgeSigningKeysOf`, the one reading of the edge signing-keys secret's text: comma-separated keys, newest
 *          first, blanks dropped, so the `env` and `secrets` drivers cannot disagree on a rotation's two keys.
 * Boundary: pure; an unset or blank secret answers no key, so every signed request is refused. The keys are never
 *           logged or put in an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4: two signing keys); ADR 0173.
 */

/**
 * The keys in the secret's `text`, newest first.
 *
 * @example
 * edgeSigningKeysOf(" next , ,previous "); // ["next", "previous"]
 */
export function edgeSigningKeysOf(text: string | undefined): readonly string[] {
  return (text ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key !== "");
}
