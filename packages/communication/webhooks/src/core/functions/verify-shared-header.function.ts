/**
 * Stackra file contract:
 * Purpose: `verifySharedHeader`, the `shared_header` scheme: the provider sends a header name and value the merchant
 *          registered with the webhook (Tabby), so the header named by the recipe must equal one of the secrets.
 * Boundary: pure apart from Web Crypto; compares in constant time (`sameBytes`). Answers `false` for a missing or
 *           different value. A shared value proves less than a signature: Tabby's docs say to confirm the payment by
 *           retrieving it, which the OS Connection does. Built from the vendor's public documentation:
 *           certification pending (owner decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";

import { sameBytes } from "#core/functions/same-bytes.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * Checks the shared header.
 *
 * @param request - the received webhook (lowercase header names).
 * @param recipe - the Integration's `webhooks.recipe` (`header`).
 * @param secrets - every value the URL accepts.
 * @example
 * await verifySharedHeader(request, { header: "x-webhook-auth" }, [secret]);
 */
export async function verifySharedHeader(
  request: Pick<InboundWebhook, "headers">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
): Promise<boolean> {
  const value = recipe.header === undefined ? undefined : request.headers[recipe.header];
  if (!value) return false;
  const received = new TextEncoder().encode(value);
  for (const secret of secrets)
    // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per secret, stopping at a match
    if (await sameBytes(new TextEncoder().encode(secret), received)) return true;
  return false;
}
