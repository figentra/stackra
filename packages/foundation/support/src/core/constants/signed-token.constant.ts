/**
 * Stackra file contract:
 * Purpose: `signedToken`, short opaque tokens that carry a purpose, an expiry, a key id and a little JSON data under an
 *          HMAC-SHA-256 (receipt links, gate and pass tokens, verify links): `sign` makes one, `verify` checks key,
 *          signature, purpose and expiry, in that order.
 * Boundary: pure apart from Web Crypto. Keys come from the caller's `SigningKeySource` (the `KeyProvider` of
 *           @stackra/contracts); the clock and the expiry come from the caller (expiry lengths are settings). The data
 *           is signed, not encrypted: never put a secret or personal data in it, put an id.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0416 (canonical JSON); STA-934.
 */
import { base64url } from "#core/constants/base64url.constant";
import { canonicalJson } from "#core/functions/canonical-json.function";
import { hmacKey } from "#core/functions/hmac-key.function";
import type { SignedTokenCheck } from "#core/types/signed-token-check.type";
import type { SigningKeySource } from "#core/types/signing-key-source.type";

const DOMAIN = "stackra.signed-token.v1\n";
const utf8 = new TextEncoder();

/**
 * Refuses a purpose that is empty or holds a line break.
 *
 * @throws RangeError when `purpose` is empty or holds a line break.
 */
function checkPurpose(purpose: string): void {
  if (typeof purpose !== "string" || purpose === "" || /[\r\n]/.test(purpose))
    throw new RangeError("signedToken: purpose must be a non-empty single-line string");
}

/**
 * Signs short opaque tokens for a purpose and expiry, and verifies them by key, signature, purpose and expiry.
 *
 * @example
 * const token = await signedToken.sign(keys, { purpose: "receipt.view", expiresAt: time.addDays(now, 30), data: { receiptId } });
 * const check = await signedToken.verify(keys, token, { purpose: "receipt.view", now: ctx.now() });
 * if (!check.ok) throw new NotFoundError();
 */
export const signedToken = Object.freeze({
  /**
   * A token for `purpose`, signed with the current key, valid until `expiresAt`.
   *
   * @throws RangeError when the purpose is empty or multi-line, or `expiresAt` is not a valid date.
   */
  async sign(
    keys: SigningKeySource,
    options: { readonly purpose: string; readonly expiresAt: Date; readonly data?: unknown },
  ): Promise<string> {
    checkPurpose(options.purpose);
    if (!(options.expiresAt instanceof Date) || Number.isNaN(options.expiresAt.getTime()))
      throw new RangeError("signedToken: expiresAt must be a valid Date");
    const key = await keys.current();
    const head = `${base64url.encode(utf8.encode(key.id))}.${base64url.encode(
      utf8.encode(
        canonicalJson({
          purpose: options.purpose,
          expiresAt: options.expiresAt,
          data: options.data ?? null,
        }),
      ),
    )}`;
    const mac = await globalThis.crypto.subtle.sign(
      "HMAC",
      await hmacKey(key.key),
      utf8.encode(DOMAIN + head),
    );
    return `${head}.${base64url.encode(new Uint8Array(mac))}`;
  },

  /**
   * Whether `token` was signed by one of `keys` for `purpose` and is still valid at `now`. Never throws on a bad
   * token; the signature is compared in constant time by Web Crypto.
   */
  async verify(
    keys: SigningKeySource,
    token: string,
    options: { readonly purpose: string; readonly now: Date },
  ): Promise<SignedTokenCheck> {
    checkPurpose(options.purpose);
    const parts = typeof token === "string" ? token.split(".") : [];
    if (parts.length !== 3) return { ok: false, reason: "malformed" };
    const [keyPart, bodyPart, macPart] = parts as [string, string, string];
    let keyId: string;
    let body: { purpose?: unknown; expiresAt?: unknown; data?: unknown };
    let mac: Uint8Array<ArrayBuffer>;
    try {
      keyId = new TextDecoder("utf-8", { fatal: true }).decode(base64url.decode(keyPart));
      body = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(base64url.decode(bodyPart)),
      );
      mac = new Uint8Array(base64url.decode(macPart));
    } catch {
      return { ok: false, reason: "malformed" };
    }
    let key: { readonly key: Uint8Array };
    try {
      key = await keys.byId(keyId);
    } catch {
      return { ok: false, reason: "unknown_key" };
    }
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      await hmacKey(key.key),
      mac,
      utf8.encode(`${DOMAIN}${keyPart}.${bodyPart}`),
    );
    if (!valid) return { ok: false, reason: "bad_signature" };
    if (body === null || typeof body !== "object" || typeof body.expiresAt !== "string")
      return { ok: false, reason: "malformed" };
    if (body.purpose !== options.purpose) return { ok: false, reason: "wrong_purpose" };
    const expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return { ok: false, reason: "malformed" };
    if (options.now.getTime() >= expiresAt.getTime()) return { ok: false, reason: "expired" };
    return { ok: true, data: body.data ?? null, keyId, expiresAt };
  },
});
