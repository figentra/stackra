/**
 * Stackra file contract:
 * Purpose: `verifyOrderedFieldHmac`, the `ordered_field_hmac` scheme: a hex HMAC (the recipe's hash) keyed by the
 *          secret's UTF-8 bytes over the values of a fixed, ordered list of body fields joined with nothing between
 *          them, carried in a query parameter, a header or a body path (Paymob's `?hmac=`, HMAC-SHA512 over
 *          `obj.amount_cents`, `obj.created_at`, …).
 * Boundary: pure apart from Web Crypto; parses the body only to read the signed fields and compares through
 *           `crypto.subtle.verify` (constant time). Answers `false` for a body that is not JSON, a missing or non-hex
 *           signature, a field that is an object, or a mismatch. Built from the vendor's public documentation:
 *           certification pending (owner decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";

import { decodeHex } from "#core/functions/decode-hex.function";
import { parseBody } from "#core/functions/parse-body.function";
import { schemeValue } from "#core/functions/scheme-value.function";
import { signedFields } from "#core/functions/signed-fields.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * Checks the HMAC over the ordered fields.
 *
 * @param request - the received webhook.
 * @param recipe - the Integration's `webhooks.recipe` (`fields`, `algorithm`, and `query`, `header` or `path`).
 * @param secrets - every HMAC secret the URL accepts.
 * @throws TypeError when a secret is empty (a configuration error).
 * @example
 * await verifyOrderedFieldHmac(request, { query: "hmac", fields: ["obj.id"], algorithm: "SHA-512" }, [secret]);
 */
export async function verifyOrderedFieldHmac(
  request: Pick<InboundWebhook, "headers" | "query" | "body">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
): Promise<boolean> {
  const payload = parseBody(request.body);
  const signature = decodeHex(schemeValue(request, recipe, payload) ?? "");
  const text = signedFields(payload, recipe.fields ?? [], recipe.decimals);
  if (signature === undefined || text === undefined || recipe.algorithm === undefined) return false;
  const content = new TextEncoder().encode(text);
  for (const secret of secrets) {
    if (secret === "") throw new TypeError("A webhook secret is a non-empty string");
    // oxlint-disable-next-line no-await-in-loop -- secrets are tried in order and the first match ends the check
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: recipe.algorithm },
      false,
      ["verify"],
    );
    // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per secret, stopping at a match
    if (await crypto.subtle.verify("HMAC", key, signature, content)) return true;
  }
  return false;
}
