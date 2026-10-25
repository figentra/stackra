/**
 * Stackra file contract:
 * Purpose: `verifyOneTimeCode(input)`, the check of a code a person typed against the stored record: locked, used or
 *          expired records refuse without checking; otherwise the peppered HMAC is compared in constant time, and the
 *          next record (attempt counted, or spent) is returned for the caller to store.
 * Boundary: pure apart from Web Crypto; the caller stores `record` atomically (compare-and-set on `attempts`), so two
 *           concurrent tries cannot both pass. A digit code is normalised like an identifier (spaces, hyphens,
 *           Arabic-Indic digits) before it is hashed; a code from a custom alphabet is only trimmed, as its case may
 *           matter.
 * Runtime: isomorphic
 * Governing contract: conflict #2; OS-184; OWASP ASVS 2.7.
 */
import { OneTimeCodeResult } from "#core/enums/one-time-code-result.enum";
import { constantTimeEqual } from "#core/functions/constant-time-equal.function";
import { normalizeIdentifier } from "#core/functions/normalize-identifier.function";
import { oneTimeCodeDigest } from "#core/functions/one-time-code-digest.function";
import type { OneTimeCodePolicy } from "#core/types/one-time-code-policy.type";
import type { OneTimeCodeRecord } from "#core/types/one-time-code-record.type";

/**
 * Checks `input.code` against `input.record`.
 *
 * @returns the outcome and the record to store in place of the old one.
 * @example
 * const { result, record } = await verifyOneTimeCode({ record: stored, code, policy, pepper, now: ctx.now() });
 */
export async function verifyOneTimeCode(input: {
  readonly record: OneTimeCodeRecord;
  readonly code: string;
  readonly policy: Pick<OneTimeCodePolicy, "maxAttempts" | "alphabet">;
  readonly pepper: string;
  readonly now: Date;
}): Promise<{ readonly result: OneTimeCodeResult; readonly record: OneTimeCodeRecord }> {
  const { record } = input;
  if (record.usedAt !== undefined || record.attempts >= input.policy.maxAttempts)
    return { result: OneTimeCodeResult.Locked, record };
  if (input.now.getTime() >= record.expiresAt.getTime())
    return { result: OneTimeCodeResult.Expired, record };
  const typed =
    input.policy.alphabet === undefined ? normalizeIdentifier(input.code) : input.code.trim();
  const digest = await oneTimeCodeDigest(input.pepper, record.purpose, record.subject, typed);
  if (constantTimeEqual(digest, record.digest))
    return { result: OneTimeCodeResult.Valid, record: { ...record, usedAt: input.now } };
  const attempts = record.attempts + 1;
  return {
    result:
      attempts >= input.policy.maxAttempts ? OneTimeCodeResult.Locked : OneTimeCodeResult.Invalid,
    record: { ...record, attempts },
  };
}
