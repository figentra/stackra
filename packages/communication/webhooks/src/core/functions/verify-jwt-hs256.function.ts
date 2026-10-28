/**
 * Stackra file contract:
 * Purpose: `verifyJwtHs256`, the `jwt_hs256` scheme: a JWT signed HS256 with the secret's UTF-8 bytes, carried in a
 *          query parameter or a header (`Authorization: Bearer …`) (Tamara's `tamaraToken`, signed with the merchant's
 *          notification token). Its header must name `HS256`, its signature must verify, and an `exp` or `nbf` claim
 *          must hold at the receiver's clock.
 * Boundary: pure apart from Web Crypto; the signature is compared by `crypto.subtle.verify` (constant time). Any other
 *           `alg` (`none` included) is refused. Answers `false` for a missing, malformed, wrongly signed, expired or
 *           not-yet-valid token; never throws for the request's content. Claims other than `exp` and `nbf` are not
 *           read. Built from the vendor's public documentation: certification pending (owner decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); RFC 7519; RFC 7515; STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { decodeBase64 } from "@stackra/support";

import { schemeValue } from "#core/functions/scheme-value.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/** The bytes of a Base64url text (RFC 7515), or `undefined` when it is not one. */
function base64url(text: string): Uint8Array<ArrayBuffer> | undefined {
  if (!/^[\w-]*$/.test(text)) return undefined;
  const base64 = text.replaceAll("-", "+").replaceAll("_", "/");
  return decodeBase64(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
}

/** The JSON object a Base64url segment holds, or `undefined`. */
function jsonOf(segment: string): Record<string, unknown> | undefined {
  const bytes = base64url(segment);
  if (bytes === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Checks the JWT.
 *
 * @param request - the received webhook.
 * @param recipe - the Integration's `webhooks.recipe` (`query` and/or `header`).
 * @param secrets - every signing secret the URL accepts.
 * @param now - the receiver's clock, for `exp` and `nbf`.
 * @throws TypeError when a secret is empty (a configuration error).
 * @example
 * await verifyJwtHs256(request, { query: "tamaraToken", header: "authorization" }, [secret], clock.now());
 */
export async function verifyJwtHs256(
  request: Pick<InboundWebhook, "headers" | "query">,
  recipe: WebhookSchemeRecipe,
  secrets: readonly string[],
  now: Date,
): Promise<boolean> {
  const token = schemeValue(request, recipe);
  const segments = token?.split(".") ?? [];
  if (segments.length !== 3) return false;
  const [head = "", body = "", signed = ""] = segments;
  const header = jsonOf(head);
  const claims = jsonOf(body);
  const signature = base64url(signed);
  if (header?.["alg"] !== "HS256" || claims === undefined || signature === undefined) return false;
  const seconds = now.getTime() / 1000;
  const { exp, nbf } = claims;
  if (exp !== undefined && (typeof exp !== "number" || seconds >= exp)) return false;
  if (nbf !== undefined && (typeof nbf !== "number" || seconds < nbf)) return false;
  const content = new TextEncoder().encode(`${head}.${body}`);
  for (const secret of secrets) {
    if (secret === "") throw new TypeError("A webhook secret is a non-empty string");
    // oxlint-disable-next-line no-await-in-loop -- secrets are tried in order and the first match ends the check
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per secret, stopping at a match
    if (await crypto.subtle.verify("HMAC", key, signature, content)) return true;
  }
  return false;
}
