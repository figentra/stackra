/**
 * Stackra file contract:
 * Purpose: `unsubscribeLink({ recipient, category, key, url })`, the one-click unsubscribe link a bulk mail carries:
 *          the host's https endpoint with a signed `token` (`<payload>.<signature>`, both base64url; the payload holds
 *          the principal's public id and the category code only).
 * Boundary: HMAC-SHA256 through Web Crypto; the key is the `NOTIFICATIONS_UNSUBSCRIBE_KEY` secret
 *           (`NotificationsConfig.unsubscribeKey`), passed in and never returned or logged. The token does not expire:
 *           it can only mute a mutable category, which the person can undo. `verifyUnsubscribeToken` reads it back.
 * Runtime: isomorphic
 * Governing contract: RFC 8058 (one-click unsubscribe); RFC 2104 (HMAC); ADR 0134; stackra-218 (STA-1376).
 */
import type { PublicId } from "@stackra/contracts";

import { base64url } from "#core/functions/base64url.function";
import { hmacKey } from "#core/functions/hmac-key.function";

/**
 * The one-click unsubscribe link of `recipient` for `category`: `url` with the signed token as `token`.
 *
 * @throws TypeError when `key` is empty or `url` is not https.
 * @example
 * const link = await unsubscribeLink({ recipient, category: "marketing", key: config.unsubscribeKey, url: config.unsubscribeUrl });
 */
export async function unsubscribeLink(input: {
  readonly recipient: PublicId<"usr">;
  readonly category: string;
  readonly key: string;
  readonly url: string;
}): Promise<string> {
  const link = new URL(input.url);
  if (link.protocol !== "https:")
    throw new TypeError(
      "unsubscribe link: RFC 8058 needs an https endpoint (notifications.unsubscribeUrl)",
    );
  const payload = base64url(
    new TextEncoder().encode(JSON.stringify({ r: input.recipient, c: input.category })),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(input.key, "sign"),
    new TextEncoder().encode(payload),
  );
  link.searchParams.set("token", `${payload}.${base64url(signature)}`);
  return link.toString();
}
