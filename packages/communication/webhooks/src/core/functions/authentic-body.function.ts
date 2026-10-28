/**
 * Stackra file contract:
 * Purpose: `authenticBody`, the one place the receiver picks a verifier by the Integration's `webhooks.scheme`: it
 *          answers the body text to parse when the request verifies (the plaintext for `aes_gcm_body`, the raw body
 *          for every other scheme), else `undefined`.
 * Boundary: internal; reads only the scheme's own data (`signature` for `hmac`, `recipe` for the six regional gateway
 *           schemes, which `registerWebhookEvents` checked at boot). Never parses a body whose check failed, apart
 *           from the field schemes reading their token or signed fields. The regional schemes are certification
 *           pending (owner decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); ADR 0224 (decision 2); STA-1357.
 */
import type { IntegrationWebhooks } from "@stackra/integrations";

import { SignatureScheme } from "#core/enums/signature-scheme.enum";
import { decryptAesGcmBody } from "#core/functions/decrypt-aes-gcm-body.function";
import { verifyBodyToken } from "#core/functions/verify-body-token.function";
import { verifyHmacWebhook } from "#core/functions/verify-hmac-webhook.function";
import { verifyJwtHs256 } from "#core/functions/verify-jwt-hs256.function";
import { verifyKeyedFieldDigest } from "#core/functions/verify-keyed-field-digest.function";
import { verifyOrderedFieldHmac } from "#core/functions/verify-ordered-field-hmac.function";
import { verifySharedHeader } from "#core/functions/verify-shared-header.function";
import { verifyWebhook } from "#core/functions/verify-webhook.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * The verified body text of `request`.
 *
 * @param request - the received webhook.
 * @param webhooks - the Integration's `webhooks` option.
 * @param secrets - every secret the URL accepts.
 * @param now - the receiver's clock.
 * @returns the text to parse, or `undefined` when the request does not verify.
 * @example
 * const text = await authenticBody(request, webhooks, [secret], clock.now());
 */
export async function authenticBody(
  request: Pick<InboundWebhook, "headers" | "query" | "body">,
  webhooks: IntegrationWebhooks,
  secrets: readonly string[],
  now: Date,
): Promise<string | undefined> {
  const { headers, body } = request;
  const recipe = webhooks.recipe ?? {};
  let verified: boolean;
  switch (webhooks.scheme) {
    case SignatureScheme.Hmac: {
      verified =
        webhooks.signature !== undefined &&
        (await verifyHmacWebhook(headers, body, webhooks.signature, secrets, now));
      break;
    }
    case SignatureScheme.AesGcmBody: {
      return decryptAesGcmBody(request, recipe, secrets);
    }
    case SignatureScheme.BodyToken: {
      verified = await verifyBodyToken(request, recipe, secrets);
      break;
    }
    case SignatureScheme.OrderedFieldHmac: {
      verified = await verifyOrderedFieldHmac(request, recipe, secrets);
      break;
    }
    case SignatureScheme.KeyedFieldDigest: {
      verified = await verifyKeyedFieldDigest(request, recipe, secrets);
      break;
    }
    case SignatureScheme.SharedHeader: {
      verified = await verifySharedHeader(request, recipe, secrets);
      break;
    }
    case SignatureScheme.JwtHs256: {
      verified = await verifyJwtHs256(request, recipe, secrets, now);
      break;
    }
    default: {
      verified = await verifyWebhook(headers, body, secrets, now);
    }
  }
  return verified ? body : undefined;
}
