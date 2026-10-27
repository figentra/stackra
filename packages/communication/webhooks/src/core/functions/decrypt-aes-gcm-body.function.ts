/**
 * Stackra file contract:
 * Purpose: `decryptAesGcmBody`, the `aes_gcm_body` scheme: the body is hex ciphertext encrypted AES-GCM with the hex
 *          secret as key, the hex IV and authentication tag in the headers the recipe names (HyperPay/OPPWA:
 *          AES-256-GCM, `x-initialization-vector`, `x-authentication-tag`). A body that decrypts under one of the
 *          secrets is authentic; the answer is the plaintext, which the receiver parses instead of the raw body.
 * Boundary: pure apart from Web Crypto; the GCM tag check is Web Crypto's (constant time). Answers `undefined` for a
 *           missing or non-hex IV, tag or body, a failed tag check, or plaintext that is not UTF-8; never throws for
 *           the request's content. Built from the vendor's public documentation: certification pending (owner
 *           decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); NIST SP 800-38D; STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";

import { decodeHex } from "#core/functions/decode-hex.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * Decrypts and authenticates the body.
 *
 * @param request - the received webhook (lowercase header names).
 * @param recipe - the Integration's `webhooks.recipe` (`ivHeader`, `tagHeader`).
 * @param secrets - every hex key the URL accepts (16, 24 or 32 bytes).
 * @returns the plaintext body, or `undefined` when it does not decrypt.
 * @throws TypeError when a secret is not 16, 24 or 32 bytes of hex (a configuration error).
 * @example
 * const text = await decryptAesGcmBody(request, { ivHeader: "x-initialization-vector", tagHeader: "x-authentication-tag" }, [key]);
 */
export async function decryptAesGcmBody(
  request: Pick<InboundWebhook, "headers" | "body">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
): Promise<string | undefined> {
  const iv = decodeHex(
    recipe.ivHeader === undefined ? "" : (request.headers[recipe.ivHeader] ?? ""),
  );
  const tag = decodeHex(
    recipe.tagHeader === undefined ? "" : (request.headers[recipe.tagHeader] ?? ""),
  );
  const cipher = decodeHex(request.body.trim());
  if (iv === undefined || tag === undefined || cipher === undefined) return undefined;
  const sealed = new Uint8Array(cipher.length + tag.length);
  sealed.set(cipher);
  sealed.set(tag, cipher.length);
  for (const secret of secrets) {
    const bytes = decodeHex(secret);
    if (bytes === undefined || ![16, 24, 32].includes(bytes.length))
      throw new TypeError("An AES-GCM webhook secret is 16, 24 or 32 bytes written in hex");
    // oxlint-disable-next-line no-await-in-loop -- secrets are tried in order and the first that decrypts ends the check
    const key = await crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, [
      "decrypt",
    ]);
    try {
      // oxlint-disable-next-line no-await-in-loop -- one tag check per secret, stopping at the first that passes
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: tag.length * 8 },
        key,
        sealed,
      );
      return new TextDecoder("utf-8", { fatal: true }).decode(plain);
    } catch {
      // a failed tag check, a tag length GCM refuses, or bytes that are not UTF-8: try the next secret
    }
  }
  return undefined;
}
