/**
 * Stackra file contract:
 * Purpose: `mintId`, the public ids this package writes: a fresh id later than every one this process minted before
 *          (runs, held signals, recorded events), or, given `from`, the one id that text always gives (a run of a
 *          `startOn` workflow keyed by its correlation).
 * Boundary: internal. A fresh id is 48 bits of milliseconds and 80 random bits, one more than the last within the same
 *           millisecond, in lowercase Crockford base 32, so ids sort in the order they were minted, as the journal's
 *           `last` relies on; `freezeIds` and `freezeClock` make it repeatable in a test. A derived id is the first 128
 *           bits of the text's SHA-256.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (public ids: `<prefix>_<26 characters>`); ADR 0102 (decision 1: run ids).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base-32 alphabet, lowercase: no i, l, o or u; in ASCII order, so text order is number order. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** The randomness keeps 80 bits. */
const RANDOM_MASK = (1n << 80n) - 1n;

/** The last millisecond and randomness minted. */
const LAST = { time: -1, random: 0n };

/** `value` as `length` base-32 characters, most significant first. */
function encode(value: bigint, length: number): string {
  let text = "";
  let rest = value;
  for (let index = 0; index < length; index++) {
    text = ALPHABET.charAt(Number(rest & 31n)) + text;
    rest >>= 5n;
  }
  return text;
}

/** `bytes` as one big-endian number. */
function numberOf(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

/**
 * A public id with `prefix`.
 *
 * @param from - text the id is derived from; a fresh id when absent.
 * @example
 * await mintId("wfr"); // "wfr_01jb6z3q0m4v9tbn1xg5rd2hc8"
 * await mintId("wfr", "orders.fulfil_order:ord_1") === (await mintId("wfr", "orders.fulfil_order:ord_1")); // true
 */
export async function mintId<P extends string>(prefix: P, from?: string): Promise<PublicId<P>> {
  if (from !== undefined) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(from));
    return `${prefix}_${encode(numberOf(new Uint8Array(digest).subarray(0, 16)), 26)}`;
  }
  const time = Date.now();
  if (time > LAST.time) {
    LAST.time = time;
    LAST.random = numberOf(globalThis.crypto.getRandomValues(new Uint8Array(10)));
  } else LAST.random = (LAST.random + 1n) & RANDOM_MASK;
  return `${prefix}_${encode(BigInt(LAST.time), 10)}${encode(LAST.random, 16)}`;
}
