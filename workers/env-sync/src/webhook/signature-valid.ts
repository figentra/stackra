/**
 * Stackra file contract:
 * Purpose: `signatureValid(header, body, secret, now)`, the check of Infisical's `x-infisical-signature` header:
 *          `t=<timestamp>;<hex HMAC-SHA256 of the body with the webhook secret>`. Infisical signs the JSON body
 *          (`JSON.stringify(payload)`) and copies the body's `timestamp` (milliseconds) into `t`, so `t` is bound by
 *          requiring it to equal the signed body's `timestamp`; that timestamp must be within five minutes of now.
 * Boundary: pure apart from Web Crypto; no secret, header or body is logged or returned.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6); Infisical's
 *                     `backend/src/services/webhook/webhook-fns.ts` (checked 2026-11-04).
 */
import { SIGNATURE_MAX_AGE_MS } from "#src/constants";

import { tokensMatch } from "./tokens-match";

/** `t=<milliseconds>;<64 hex>`. */
const HEADER = /^t=(\d{1,16});([0-9a-f]{64})$/;

const encoder = new TextEncoder();

/** Lower-case hex HMAC-SHA256 of `message` with `secret`. */
async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The body's top-level `timestamp`, when the body is a JSON object with a numeric one. */
function bodyTimestamp(body: string): number | undefined {
  try {
    const parsed: unknown = JSON.parse(body);
    const timestamp =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as { timestamp?: unknown }).timestamp
        : undefined;
    return typeof timestamp === "number" && Number.isFinite(timestamp) ? timestamp : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether `header` signs `body` with `secret`, recently enough.
 *
 * @param now - the current time in milliseconds.
 * @example
 * if (!(await signatureValid(request.headers.get("x-infisical-signature"), body, secret, Date.now()))) return 401;
 */
export async function signatureValid(
  header: string | null,
  body: string,
  secret: string,
  now: number,
): Promise<boolean> {
  const match = HEADER.exec(header?.trim().toLowerCase() ?? "");
  if (match === null) return false;
  const [, stamp = "", signature = ""] = match;
  if (!(await tokensMatch(signature, await hmacHex(secret, body)))) return false;
  // Only now is the body Infisical's: its timestamp must be the header's and recent.
  const timestamp = bodyTimestamp(body);
  return (
    timestamp !== undefined &&
    timestamp === Number(stamp) &&
    Math.abs(now - timestamp) <= SIGNATURE_MAX_AGE_MS
  );
}
