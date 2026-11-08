/**
 * Stackra file contract:
 * Purpose: `verifyLabelledFieldHmac`, the `labelled_field_hmac` scheme: a hex HMAC (the recipe's hash) keyed by the
 *          secret's UTF-8 bytes over each `label` followed by the value at its body `path`, in the recipe's order and
 *          joined with nothing, carried in a header or a query parameter. The amount at `currencyDecimals.path` is
 *          written with the minor-unit decimals of the ISO 4217 currency at `currencyDecimals.currencyPath`, read from
 *          `@stackra/money`'s one table (`100` signs `100.000` in KWD, `100` in JPY, `100.00` in SAR).
 * Boundary: pure apart from Web Crypto; parses the body only to read the signed fields and compares through
 *           `crypto.subtle.verify` (constant time). Answers `false` for a body that is not JSON, a missing or non-hex
 *           signature, a missing, null or object field, an amount the currency cannot hold, or a mismatch. A recipe
 *           header name is matched lowercase, as the receiver lowercases header names. Certification pending (owner
 *           decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); ADR 0220 (decision 2: the ISO 4217 exponent).
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { Money } from "@stackra/money";

import { decodeHex } from "#core/functions/decode-hex.function";
import { parseBody } from "#core/functions/parse-body.function";
import { schemeValue } from "#core/functions/scheme-value.function";
import { valueAt } from "#core/functions/value-at.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/** The signed text: each label and its value, or `undefined` when a field cannot be signed. */
function labelledText(payload: unknown, recipe: WebhookSchemeRecipe): string | undefined {
  const fields = recipe.labelledFields ?? [];
  if (fields.length === 0) return undefined;
  const amount = recipe.currencyDecimals;
  let text = "";
  for (const { label, path } of fields) {
    const value = valueAt(payload, path);
    if (value === undefined || value === null || typeof value === "object") return undefined;
    if (amount?.path !== path) {
      text += label + String(value);
      continue;
    }
    const currency = valueAt(payload, amount.currencyPath);
    if (typeof currency !== "string") return undefined;
    try {
      text += label + Money.of(String(value), currency.toUpperCase()).toDecimal();
    } catch {
      // Not a decimal, more fraction digits than the currency holds, or no ISO 4217 code: nothing to sign.
      return undefined;
    }
  }
  return text;
}

/**
 * Checks the HMAC over the labelled fields.
 *
 * @param request - the received webhook.
 * @param recipe - the Integration's `webhooks.recipe` (`labelledFields`, `algorithm`, `header` or `query`, and
 *   optionally `currencyDecimals`).
 * @param secrets - every HMAC secret the URL accepts.
 * @throws TypeError when a secret is empty (a configuration error).
 * @example
 * await verifyLabelledFieldHmac(
 *   request,
 *   { header: "x-signature", algorithm: "SHA-256", labelledFields: [{ label: "id", path: "id" }] },
 *   [secret],
 * );
 */
export async function verifyLabelledFieldHmac(
  request: Pick<InboundWebhook, "headers" | "query" | "body">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
): Promise<boolean> {
  const payload = parseBody(request.body);
  const carrier =
    recipe.header === undefined ? recipe : { ...recipe, header: recipe.header.toLowerCase() };
  const signature = decodeHex(schemeValue(request, carrier) ?? "");
  const text = labelledText(payload, recipe);
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
