/**
 * Stackra file contract:
 * Purpose: `verifyKeyedFieldDigest`, the `keyed_field_digest` scheme: a hex digest (the recipe's hash, no HMAC) of
 *          the values of a fixed, ordered list of body fields followed by the secret, carried at a body path, a query
 *          parameter or a header (Fawry's `messageSignature`: SHA-256 over `fawryRefNumber`, `merchantRefNumber`,
 *          `paymentAmount` and `orderAmount` with two decimals, `orderStatus`, `paymentMethod`, `paymentRefNumber`,
 *          then the secure key).
 * Boundary: pure apart from Web Crypto; parses the body only to read the signed fields and compares the digests in
 *           constant time (`sameBytes`). Answers `false` for a body that is not JSON, a missing or non-hex signature, a
 *           field that is an object, or a mismatch. Built from the vendor's public documentation: certification
 *           pending (owner decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";

import { decodeHex } from "#core/functions/decode-hex.function";
import { parseBody } from "#core/functions/parse-body.function";
import { sameBytes } from "#core/functions/same-bytes.function";
import { schemeValue } from "#core/functions/scheme-value.function";
import { signedFields } from "#core/functions/signed-fields.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * Checks the keyed digest of the ordered fields.
 *
 * @param request - the received webhook.
 * @param recipe - the Integration's `webhooks.recipe` (`fields`, `algorithm`, `decimals`, and `path`, `query` or
 *                 `header`).
 * @param secrets - every secure key the URL accepts.
 * @throws TypeError when a secret is empty (a configuration error).
 * @example
 * const recipe = { path: "messageSignature", fields: ["fawryRefNumber"], algorithm: "SHA-256" } as const;
 * await verifyKeyedFieldDigest(request, recipe, [secureKey]);
 */
export async function verifyKeyedFieldDigest(
  request: Pick<InboundWebhook, "headers" | "query" | "body">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
): Promise<boolean> {
  const payload = parseBody(request.body);
  const signature = decodeHex(schemeValue(request, recipe, payload) ?? "");
  const text = signedFields(payload, recipe.fields ?? [], recipe.decimals);
  if (signature === undefined || text === undefined || recipe.algorithm === undefined) return false;
  for (const secret of secrets) {
    if (secret === "") throw new TypeError("A webhook secret is a non-empty string");
    // oxlint-disable-next-line no-await-in-loop -- secrets are tried in order and the first match ends the check
    const digest = await crypto.subtle.digest(
      recipe.algorithm,
      new TextEncoder().encode(`${text}${secret}`),
    );
    // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per secret, stopping at a match
    if (await sameBytes(new Uint8Array(digest), signature)) return true;
  }
  return false;
}
