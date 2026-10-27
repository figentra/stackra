/**
 * Stackra file contract:
 * Purpose: `verifyUnsubscribeToken(token, key)`, the recipient and category an `unsubscribeLink` token was signed for,
 *          or undefined for a forged or malformed token.
 * Boundary: HMAC-SHA256 through Web Crypto; `crypto.subtle.verify` compares in constant time. The key is the
 *           `NOTIFICATIONS_UNSUBSCRIBE_KEY` secret, passed in and never returned or logged; an empty key throws.
 * Runtime: isomorphic
 * Governing contract: RFC 8058 (one-click unsubscribe); RFC 2104 (HMAC); stackra-218 (STA-1376).
 */
import type { PublicId } from "@stackra/contracts";
import { base64url } from "@stackra/support";

import { hmacKey } from "#core/functions/hmac-key.function";

/**
 * The recipient and category `token` was signed for under `key`; undefined when it is forged or malformed.
 *
 * @throws TypeError when `key` is empty.
 * @example
 * const target = await verifyUnsubscribeToken(request.query.token, config.unsubscribeKey);
 * if (target) await preferences.set(target.recipient, target.category, NotificationChannel.Mail, false);
 */
export async function verifyUnsubscribeToken(
  token: string,
  key: string,
): Promise<{ readonly recipient: PublicId<"usr">; readonly category: string } | undefined> {
  const verifier = await hmacKey(key, "verify");
  const [payload, signature, extra] = token.split(".");
  if (payload === undefined || signature === undefined || extra !== undefined) return undefined;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      verifier,
      base64url.decode(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return undefined;
    const body: unknown = JSON.parse(new TextDecoder().decode(base64url.decode(payload)));
    if (typeof body !== "object" || body === null) return undefined;
    const { r, c } = body as { r?: unknown; c?: unknown };
    if (typeof r !== "string" || typeof c !== "string") return undefined;
    return { recipient: r as PublicId<"usr">, category: c };
  } catch {
    // a token that is not base64url or not JSON is malformed, not an error
    return undefined;
  }
}
