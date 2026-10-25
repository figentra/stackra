/**
 * Stackra file contract:
 * Purpose: `mintApiKey`, a new API key of one kind: the kind's configured prefix, an underscore, 30 random base-62
 *          characters and a 6-character base-62 CRC-32 of the prefix and body (the GitHub token shape).
 * Boundary: pure apart from `crypto.getRandomValues`. The identity service shows the key once and stores only its hash
 *           (ADR 0278 decision 3); this never stores or logs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 3 to 5); COM-56 (publishable Storefront key).
 */
import type { IdentityConfig } from "#config/identity.config";
import type { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { BASE62, base62Of } from "#core/functions/base62-of.function";
import { crc32 } from "#core/functions/crc32.function";

/** Characters of random body. */
const BODY_LENGTH = 30;

/**
 * A new key of `kind`.
 *
 * @example
 * const key = mintApiKey(ApiKeyKind.Publishable, identity); // "stackra_pk_…"
 */
export function mintApiKey(
  kind: ApiKeyKind,
  config: Pick<IdentityConfig, "apiKeyPrefixes">,
): string {
  // 62 * 4 = 248 < 256, so dropping bytes of 248 or more keeps every digit equally likely.
  let body = "";
  while (body.length < BODY_LENGTH)
    for (const byte of crypto.getRandomValues(new Uint8Array(BODY_LENGTH)))
      if (byte < 248 && body.length < BODY_LENGTH) body += BASE62[byte % 62];
  const head = `${config.apiKeyPrefixes[kind]}_${body}`;
  return `${head}${base62Of(crc32(head), 6)}`;
}
