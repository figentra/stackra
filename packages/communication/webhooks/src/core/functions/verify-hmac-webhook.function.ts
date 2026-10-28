/**
 * Stackra file contract:
 * Purpose: `verifyHmacWebhook`, whether a received webhook carries an HMAC signature, made with one of the given
 *          secrets, of the text its Integration's `WebhookSignature` recipe describes, and (when the recipe sets a
 *          tolerance) was sent within it: the `hmac` scheme, one mechanism for every provider whose recipe is data
 *          (Stripe's `t=…,v1=…` over `<t>.<body>`, Checkout.com's hex digest of the body).
 * Boundary: pure apart from Web Crypto; answers `false` for a missing, malformed, stale or unmatched signature and never
 *           throws for the request's content. Each candidate is compared by `crypto.subtle.verify`, in constant time.
 *           The body is the raw text as received; a `{body}` inside it is never expanded. Header names are lowercase.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 17); ADR 0224 (decision 2); config-model (the recipe is data).
 *                     Stackra-223: a stored recipe's short form (`"5m"`) reads through `Duration.parse`.
 */
import { Duration } from "@stackra/contracts";
import type { WebhookSignature } from "@stackra/integrations";
import { decodeBase64 } from "@stackra/support";

import { decodeHex } from "#core/functions/decode-hex.function";

/** The signature values and the timestamp a header holds under `recipe`. */
function partsOf(
  value: string,
  recipe: WebhookSignature,
): { signatures: string[]; timestamp?: string } {
  const { parts } = recipe;
  if (parts === undefined) return { signatures: [value.trim()] };
  const signatures: string[] = [];
  let timestamp: string | undefined;
  for (const piece of value.split(parts.separator)) {
    const at = piece.indexOf(parts.assign);
    if (at < 0) continue;
    const name = piece.slice(0, at).trim();
    const text = piece.slice(at + parts.assign.length).trim();
    if (name === parts.signature) signatures.push(text);
    else if (parts.timestamp !== undefined && name === parts.timestamp) timestamp = text;
  }
  return { signatures, ...(timestamp === undefined ? {} : { timestamp }) };
}

/**
 * The HMAC key of `secret` under `recipe`.
 *
 * @throws TypeError when the secret is empty or not the Base64 the recipe says (a configuration error).
 */
function keyOf(secret: string, recipe: WebhookSignature): Promise<CryptoKey> {
  const prefix = recipe.secretPrefix ?? "";
  const bytes =
    recipe.secretEncoding === "base64"
      ? decodeBase64(secret.startsWith(prefix) ? secret.slice(prefix.length) : secret)
      : new TextEncoder().encode(secret);
  if (bytes === undefined || bytes.length === 0)
    throw new TypeError("A webhook secret is a non-empty string, Base64 when its recipe says so");
  return crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: recipe.algorithm }, false, [
    "verify",
  ]);
}

/**
 * Checks one received webhook against `recipe`.
 *
 * @param headers - the request's headers, lowercase names.
 * @param body - the raw body, exactly as received.
 * @param recipe - the Integration's `webhooks.signature`.
 * @param secrets - every secret the URL accepts (two during a rotation).
 * @param now - the receiver's clock.
 * @throws TypeError when a secret is empty or malformed (a configuration error, never the sender's).
 * @example
 * if (!(await verifyHmacWebhook(request.headers, request.body, webhooks.signature, [secret], clock.now())))
 *   throw InvalidSignatureError.create();
 */
export async function verifyHmacWebhook(
  headers: Readonly<Record<string, string | undefined>>,
  body: string,
  recipe: WebhookSignature,
  secrets: readonly string[],
  now: Date,
): Promise<boolean> {
  const value = headers[recipe.header];
  if (!value) return false;
  const parsed = partsOf(value, recipe);
  const timestamp =
    recipe.timestampHeader === undefined ? parsed.timestamp : headers[recipe.timestampHeader];
  const timed = recipe.tolerance !== undefined || recipe.payload.includes("{timestamp}");
  if (timed && (timestamp === undefined || !/^\d{1,12}$/.test(timestamp))) return false;
  if (
    recipe.tolerance !== undefined &&
    Math.abs(now.getTime() - Number(timestamp) * 1000) >
      Duration.toMilliseconds(Duration.parse(recipe.tolerance))
  )
    return false;
  const id = recipe.idHeader === undefined ? undefined : headers[recipe.idHeader];
  if (recipe.payload.includes("{id}") && !id) return false;
  const values: Readonly<Record<string, string>> = {
    body,
    timestamp: timestamp ?? "",
    id: id ?? "",
  };
  const content = new TextEncoder().encode(
    recipe.payload.replaceAll(/\{(body|timestamp|id)\}/g, (_, name: string) => values[name] ?? ""),
  );
  const decode = recipe.encoding === "hex" ? decodeHex : decodeBase64;
  const candidates = parsed.signatures
    .map((signature) => decode(signature))
    .filter((bytes) => bytes !== undefined);
  if (candidates.length === 0) return false;
  for (const secret of secrets) {
    // oxlint-disable-next-line no-await-in-loop -- secrets are tried in order and the first match ends the check
    const key = await keyOf(secret, recipe);
    for (const candidate of candidates)
      // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per candidate, stopping at a match
      if (await crypto.subtle.verify("HMAC", key, candidate, content)) return true;
  }
  return false;
}
