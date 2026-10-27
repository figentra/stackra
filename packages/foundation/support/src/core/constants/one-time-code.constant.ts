/**
 * Stackra file contract:
 * Purpose: `oneTimeCode`, short numeric codes that work once (safe-pickup codes): `issue` draws a uniform random code
 *          and returns it with a record holding only a peppered HMAC, expiry and attempts; `verify` checks a guess in
 *          constant time, accepts it at most once and returns the record to store next.
 * Boundary: pure apart from Web Crypto (`getRandomValues`, HMAC). It stores nothing: the service persists the record
 *           with a compare-and-set. Code length, lifetime and attempts are rule-set or settings values the caller
 *           passes (`@academorix/safeguarding-rules`), never defaults here. The pepper is the caller's key source.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0173 (nobody reads a value); ACA-538; STA-934.
 */
import { base64url } from "#core/constants/base64url.constant";
import { hmacKey } from "#core/functions/hmac-key.function";
import type { OneTimeCodeCheck } from "#core/types/one-time-code-check.type";
import type { OneTimeCodeRecord } from "#core/types/one-time-code-record.type";
import type { SigningKeySource } from "#core/types/signing-key-source.type";

const DOMAIN = "stackra.one-time-code.v1\n";
const utf8 = new TextEncoder();
/** The largest multiple of 10 that fits in a uint32: draws at or above it are redrawn so every digit is equally likely. */
const DIGIT_LIMIT = Math.floor(2 ** 32 / 10) * 10;

/**
 * Refuses a purpose that is empty or holds a line break.
 *
 * @throws RangeError when `purpose` is empty or holds a line break.
 */
function checkPurpose(purpose: string): void {
  if (typeof purpose !== "string" || purpose === "" || /[\r\n]/.test(purpose))
    throw new RangeError("oneTimeCode: purpose must be a non-empty single-line string");
}

/** `length` uniformly random decimal digits. */
function randomDigits(length: number): string {
  let code = "";
  const draw = new Uint32Array(length);
  while (code.length < length) {
    globalThis.crypto.getRandomValues(draw);
    for (const value of draw) if (value < DIGIT_LIMIT && code.length < length) code += value % 10;
  }
  return code;
}

/**
 * Issues short numeric codes that work once and verifies a guess against the stored record.
 *
 * @example
 * const { code, record } = await oneTimeCode.issue(keys, { purpose: "pickup", length: rules.codeLength, expiresAt, maxAttempts: rules.attempts });
 * const check = await oneTimeCode.verify(keys, stored, typed, { purpose: "pickup", now: ctx.now() });
 * await store.compareAndSet(id, stored, check.record);
 */
export const oneTimeCode = Object.freeze({
  /**
   * A new code for `purpose` and the record to store for it. Hand the code to its holder once; it is not kept.
   *
   * @throws RangeError when the purpose is empty or multi-line, `length` is not 4 to 12, `maxAttempts` is not a whole
   *         number from 1, or `expiresAt` is not a valid date.
   */
  async issue(
    keys: SigningKeySource,
    options: {
      readonly purpose: string;
      readonly length: number;
      readonly expiresAt: Date;
      readonly maxAttempts: number;
    },
  ): Promise<{ readonly code: string; readonly record: OneTimeCodeRecord }> {
    checkPurpose(options.purpose);
    if (!Number.isInteger(options.length) || options.length < 4 || options.length > 12)
      throw new RangeError("oneTimeCode: length must be a whole number from 4 to 12");
    if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1)
      throw new RangeError("oneTimeCode: maxAttempts must be a whole number from 1");
    if (!(options.expiresAt instanceof Date) || Number.isNaN(options.expiresAt.getTime()))
      throw new RangeError("oneTimeCode: expiresAt must be a valid Date");
    const key = await keys.current();
    const code = randomDigits(options.length);
    const digest = await globalThis.crypto.subtle.sign(
      "HMAC",
      await hmacKey(key.key),
      utf8.encode(`${DOMAIN}${options.purpose}\n${code}`),
    );
    return {
      code,
      record: Object.freeze({
        keyId: key.id,
        digest: base64url.encode(new Uint8Array(digest)),
        expiresAt: options.expiresAt.toISOString(),
        attemptsLeft: options.maxAttempts,
        usedAt: null,
      }),
    };
  },

  /**
   * Whether `code` matches `record` for `purpose` at `now`. A match marks the record used; a miss spends one attempt;
   * a used, expired or locked record is refused unchanged. Never throws on a bad guess.
   */
  async verify(
    keys: SigningKeySource,
    record: OneTimeCodeRecord,
    code: string,
    options: { readonly purpose: string; readonly now: Date },
  ): Promise<OneTimeCodeCheck> {
    checkPurpose(options.purpose);
    if (record.usedAt !== null) return { ok: false, reason: "used", record };
    // an unreadable expiry counts as expired (NaN compares false)
    if (!(options.now.getTime() < new Date(record.expiresAt).getTime()))
      return { ok: false, reason: "expired", record };
    if (record.attemptsLeft < 1) return { ok: false, reason: "locked", record };
    let key: { readonly key: Uint8Array };
    try {
      key = await keys.byId(record.keyId);
    } catch {
      return { ok: false, reason: "unknown_key", record };
    }
    let digest: Uint8Array<ArrayBuffer>;
    try {
      digest = new Uint8Array(base64url.decode(record.digest));
    } catch {
      return {
        ok: false,
        reason: "mismatch",
        record: { ...record, attemptsLeft: record.attemptsLeft - 1 },
      };
    }
    const match = await globalThis.crypto.subtle.verify(
      "HMAC",
      await hmacKey(key.key),
      digest,
      utf8.encode(`${DOMAIN}${options.purpose}\n${String(code)}`),
    );
    return match
      ? { ok: true, record: { ...record, usedAt: options.now.toISOString() } }
      : {
          ok: false,
          reason: "mismatch",
          record: { ...record, attemptsLeft: record.attemptsLeft - 1 },
        };
  },
});
