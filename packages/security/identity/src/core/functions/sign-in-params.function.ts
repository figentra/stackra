/**
 * Stackra file contract:
 * Purpose: `signInParams`, the OpenID Connect authorization parameters a `SignInOptions` adds: `acr_values`,
 *          `max_age` and `prompt=login`; the extra scopes are the caller's to merge with the configured ones.
 * Boundary: internal and pure; the PKCE driver adds them to its authorization URL and the BFF driver to its login URL.
 * Runtime: isomorphic
 * Governing contract: OpenID Connect Core (section 3.1.2.1); ADR 0207 (decision 1); owner round 3 #21.
 */
import type { SignInOptions } from "#contracts/index";

/**
 * The parameters of `options`.
 *
 * @throws RangeError when `maxAge` is not a whole number of zero or more.
 * @example
 * new URLSearchParams({ ...base, ...signInParams(options) });
 */
export function signInParams(options: SignInOptions = {}): Record<string, string> {
  const params: Record<string, string> = {};
  if (options.acrValues !== undefined && options.acrValues.length > 0)
    params.acr_values = options.acrValues.join(" ");
  if (options.maxAge !== undefined) {
    if (!Number.isInteger(options.maxAge) || options.maxAge < 0)
      throw new RangeError(`max_age is a whole number of seconds, got ${options.maxAge}`);
    params.max_age = String(options.maxAge);
  }
  if (options.forceLogin === true) params.prompt = "login";
  return params;
}
