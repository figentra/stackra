/**
 * Stackra file contract:
 * Purpose: `verifyWebhook`, whether a received webhook is signed by one of the given secrets and was sent within five
 *          minutes of now: the Standard Webhooks check, which also reads Svix's `svix-*` header names (Resend signs
 *          through Svix).
 * Boundary: pure apart from Web Crypto; answers `false` for any missing, malformed, stale or unmatched header and never
 *           throws for the request's content. Each candidate signature is compared by `crypto.subtle.verify`, which runs
 *           in constant time. Header names are read lowercase, as HTTP/2 and Node deliver them.
 * Runtime: isomorphic
 * Governing contract: the Standard Webhooks specification; ADR 0224 (decision 2); ADR 0308 (rules 15 and 17).
 */
import { decodeBase64 } from "@stackra/support";

import { signingKey } from "#core/functions/signing-key.function";

/** How far the sender's clock may be from ours, in seconds, either way (the specification's default). */
const TOLERANCE_SECONDS = 5 * 60;

/** A header by its Standard Webhooks name, else its Svix name. */
function headerOf(
  headers: Readonly<Record<string, string | undefined>>,
  name: "id" | "timestamp" | "signature",
): string | undefined {
  return headers[`webhook-${name}`] ?? headers[`svix-${name}`];
}

/**
 * Checks one received webhook.
 *
 * @param headers - the request's headers, lowercase names.
 * @param body - the raw body, exactly as received.
 * @param secrets - every secret the URL accepts (two during a rotation).
 * @param now - the receiver's clock.
 * @throws TypeError when a secret is empty or malformed (a configuration error, never the sender's).
 * @example
 * if (!(await verifyWebhook(request.headers, request.body, [secret], clock.now()))) throw InvalidSignatureError.create();
 */
export async function verifyWebhook(
  headers: Readonly<Record<string, string | undefined>>,
  body: string,
  secrets: readonly string[],
  now: Date,
): Promise<boolean> {
  const id = headerOf(headers, "id");
  const timestamp = headerOf(headers, "timestamp");
  const signature = headerOf(headers, "signature");
  if (!id || !timestamp || !signature || !/^\d{1,12}$/.test(timestamp)) return false;
  if (Math.abs(now.getTime() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const content = new TextEncoder().encode(`${id}.${timestamp}.${body}`);
  const candidates = signature
    .split(" ")
    .filter((entry) => entry.startsWith("v1,"))
    .map((entry) => decodeBase64(entry.slice(3)))
    .filter((bytes) => bytes !== undefined);
  for (const secret of secrets) {
    // oxlint-disable-next-line no-await-in-loop -- secrets are tried in order and the first match ends the check
    const key = await signingKey(secret, "verify");
    for (const candidate of candidates)
      // oxlint-disable-next-line no-await-in-loop -- one constant-time comparison per candidate, stopping at a match
      if (await crypto.subtle.verify("HMAC", key, candidate, content)) return true;
  }
  return false;
}
