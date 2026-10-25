/**
 * Stackra file contract:
 * Purpose: `issueOneTimeCode(input)`, a new one-time code for a purpose and a subject: the code to deliver (once, by
 *          the notifications channel) and the record to store, which holds only the peppered HMAC.
 * Boundary: randomness is Web Crypto's, drawn without modulo bias; the time is the caller's (`now`), never the host
 *           clock. The pepper is a secret the caller reads from the secret store; it is never stored with the
 *           record. Delivery and metering are the caller's (OS-36, OS-184).
 * Runtime: isomorphic
 * Governing contract: conflict #2 (one-time codes in validation); OS-184; OWASP ASVS 2.7.
 */
import { oneTimeCodeDigest } from "#core/functions/one-time-code-digest.function";
import type { OneTimeCodePolicy } from "#core/types/one-time-code-policy.type";
import type { OneTimeCodeRecord } from "#core/types/one-time-code-record.type";

/** The default alphabet: the ten digits. */
const DIGITS = "0123456789";

/** A random index below `size`, without modulo bias. */
function randomIndex(size: number): number {
  const limit = Math.floor(256 / size) * size;
  const byte = new Uint8Array(1);
  do {
    crypto.getRandomValues(byte);
  } while ((byte[0] ?? 0) >= limit);
  return (byte[0] ?? 0) % size;
}

/**
 * Issues a code.
 *
 * @throws RangeError when the policy is out of bounds (length 4 to 12, an alphabet of 2 to 64 distinct characters,
 *   a positive lifetime, attempts from 1).
 * @example
 * const { code, record } = await issueOneTimeCode({ purpose: "login", subject: userId, policy, pepper, now: ctx.now() });
 */
export async function issueOneTimeCode(input: {
  readonly purpose: string;
  readonly subject: string;
  readonly policy: OneTimeCodePolicy;
  readonly pepper: string;
  readonly now: Date;
}): Promise<{ readonly code: string; readonly record: OneTimeCodeRecord }> {
  const { policy } = input;
  const alphabet = policy.alphabet ?? DIGITS;
  if (!Number.isInteger(policy.length) || policy.length < 4 || policy.length > 12)
    throw new RangeError("issueOneTimeCode: length must be 4 to 12");
  if (alphabet.length < 2 || alphabet.length > 64 || new Set(alphabet).size !== alphabet.length)
    throw new RangeError("issueOneTimeCode: the alphabet needs 2 to 64 distinct characters");
  if (!(policy.ttlSeconds > 0) || !Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1)
    throw new RangeError("issueOneTimeCode: needs a positive lifetime and attempts from 1");
  let code = "";
  for (let index = 0; index < policy.length; index += 1)
    code += alphabet[randomIndex(alphabet.length)];
  const record: OneTimeCodeRecord = {
    purpose: input.purpose,
    subject: input.subject,
    digest: await oneTimeCodeDigest(input.pepper, input.purpose, input.subject, code),
    expiresAt: new Date(input.now.getTime() + policy.ttlSeconds * 1000),
    attempts: 0,
  };
  return { code, record };
}
