/**
 * Stackra file contract:
 * Purpose: `verifyBodyToken`, the `body_token` scheme: the body carries, at the recipe's path, a token the merchant
 *          set when registering the webhook (Moyasar's `secret_token`), and it must equal one of the secrets.
 * Boundary: pure apart from Web Crypto; parses the body only to read the token and compares it in constant time
 *           (`sameBytes`). Answers `false` for a body that is not JSON, a missing token or a mismatch; never throws for
 *           the request's content. Built from the vendor's public documentation: certification pending (owner
 *           decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";

import { parseBody } from "#core/functions/parse-body.function";
import { sameBytes } from "#core/functions/same-bytes.function";
import { schemeValue } from "#core/functions/scheme-value.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * Checks the token in the body.
 *
 * @param request - the received webhook.
 * @param recipe - the Integration's `webhooks.recipe` (`path`).
 * @param secrets - every token the URL accepts.
 * @example
 * await verifyBodyToken(request, { path: "secret_token" }, [secret]);
 */
export async function verifyBodyToken(
  request: Pick<InboundWebhook, "headers" | "query" | "body">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
): Promise<boolean> {
  const token = schemeValue(request, recipe, parseBody(request.body));
  if (token === undefined) return false;
  const received = new TextEncoder().encode(token);
  for (const secret of secrets)
    // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per secret, stopping at a match
    if (await sameBytes(new TextEncoder().encode(secret), received)) return true;
  return false;
}
