/**
 * Stackra file contract:
 * Purpose: `redactSecrets`, which scrubs a value a provider sent back before it enters a refusal: a value that equals or
 *          contains one of the call's credential values becomes `"[redacted]"`.
 * Boundary: internal; the managed client and `requestToken` call it with the credentials they sent. Empty and missing
 *           credentials are skipped. The value is replaced whole, so no part of a credential stays.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 13 and 20); ADR 0173 (nobody reads a value).
 */

/** What a scrubbed value becomes. */
const REDACTED = "[redacted]";

/**
 * `value`, or `"[redacted]"` when it holds one of `secrets`.
 *
 * @example
 * redactSecrets("sk_test_123", ["sk_test_123"]); // "[redacted]"
 * redactSecrets("invalid_api_key", ["sk_test_123"]); // "invalid_api_key"
 */
export function redactSecrets(value: string, secrets: Iterable<string | undefined>): string {
  for (const secret of secrets)
    if (secret !== undefined && secret !== "" && value.includes(secret)) return REDACTED;
  return value;
}
