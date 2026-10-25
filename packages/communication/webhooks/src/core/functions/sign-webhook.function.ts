/**
 * Stackra file contract:
 * Purpose: `signWebhook`, the Standard Webhooks headers of a message: HMAC-SHA256 of
 *          `<webhook-id>.<webhook-timestamp>.<body>` with each secret, as `v1,<base64>` signatures.
 * Boundary: pure apart from Web Crypto. Two secrets during a rotation give two signatures, so a receiver holding either
 *           one verifies (ADR 0308 rule 17). The secrets are the caller's, read blind from the secret store just before
 *           the call; nothing here keeps or logs them.
 * Runtime: isomorphic
 * Governing contract: the Standard Webhooks specification; ADR 0224 (decision 2); ADR 0308 (rule 17); ADR 0173.
 */
import { signingKey } from "#core/functions/signing-key.function";
import type { WebhookHeaders } from "#core/types/webhook-headers.type";
import type { WebhookMessage } from "#core/types/webhook-message.type";

/**
 * Signs `message` with every secret.
 *
 * @throws TypeError when `secrets` is empty or holds an empty or malformed secret.
 * @example
 * const headers = await signWebhook({ id: eventId, timestamp: ctx.now(), body }, [current, previous]);
 */
export async function signWebhook(
  message: WebhookMessage,
  secrets: readonly string[],
): Promise<WebhookHeaders> {
  if (secrets.length === 0) throw new TypeError("signWebhook needs at least one secret");
  const timestamp = String(Math.floor(message.timestamp.getTime() / 1000));
  const content = new TextEncoder().encode(`${message.id}.${timestamp}.${message.body}`);
  const signatures = await Promise.all(
    secrets.map(async (secret) => {
      const mac = await crypto.subtle.sign("HMAC", await signingKey(secret, "sign"), content);
      return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
    }),
  );
  return {
    "webhook-id": message.id,
    "webhook-timestamp": timestamp,
    "webhook-signature": signatures.join(" "),
  };
}
