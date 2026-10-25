/**
 * Stackra file contract:
 * Purpose: `checkPublishableKey`, the gateway's first gate for a browser's API key: a well-formed publishable key,
 *          used from an origin its record lists.
 * Boundary: pure: the key's record (its origins) is the caller's lookup by the key's hash; scopes and tenant binding
 *           are checked after (ADR 0278 decisions 6 and 7). A secret key from a browser is refused here.
 * Runtime: isomorphic
 * Governing contract: COM-56; ADR 0278 (decisions 4, 5 and 7).
 */
import type { IdentityConfig } from "#config/identity.config";
import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";
import { isOriginAllowed } from "#core/functions/is-origin-allowed.function";
import { parseApiKey } from "#core/functions/parse-api-key.function";

/**
 * Throws unless `key` is a publishable key used from one of `origins`.
 *
 * @throws ApiKeyRejectedError when the key is not a well-formed publishable key or the origin is not bound.
 * @example
 * checkPublishableKey(request.headers.get("x-api-key") ?? "", request.headers.get("origin"), record.origins, identity);
 */
export function checkPublishableKey(
  key: string,
  origin: string | null | undefined,
  origins: readonly string[],
  config: Pick<IdentityConfig, "apiKeyPrefixes">,
): void {
  const parsed = parseApiKey(key, config);
  const publishable = parsed?.kind === ApiKeyKind.Publishable && parsed.wellFormed;
  if (!publishable || !isOriginAllowed(origin, origins)) throw ApiKeyRejectedError.create();
}
