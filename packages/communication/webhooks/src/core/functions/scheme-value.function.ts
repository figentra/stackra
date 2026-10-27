/**
 * Stackra file contract:
 * Purpose: `schemeValue`, the token, signature or JWT a non-HMAC-body scheme reads, from where its
 *          `WebhookSchemeRecipe` says: the query parameter, else the header (a `Bearer ` prefix dropped), else the body
 *          path; `undefined` when it is missing, empty or not a string.
 * Boundary: internal; read by the body-token, field and JWT schemes. Header names are lowercase. Never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";

import { valueAt } from "#core/functions/value-at.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/**
 * The value `recipe` locates.
 *
 * @param request - the received webhook.
 * @param recipe - the Integration's `webhooks.recipe`.
 * @param payload - the parsed body, for a recipe that reads a body path.
 * @example
 * schemeValue(request, { query: "hmac" }); // the `?hmac=` value
 */
export function schemeValue(
  request: Pick<InboundWebhook, "headers" | "query">,
  recipe: WebhookSchemeRecipe,
  payload?: unknown,
): string | undefined {
  let value: unknown;
  if (recipe.query !== undefined) value = request.query?.[recipe.query];
  if (!value && recipe.header !== undefined)
    value = request.headers[recipe.header]?.replace(/^Bearer\s+/i, "");
  if (!value && recipe.path !== undefined) value = valueAt(payload, recipe.path);
  return typeof value === "string" && value !== "" ? value : undefined;
}
