/**
 * Stackra file contract:
 * Purpose: `mintEventId`, the id of a message the writer creates: `evt_` and 26 Crockford base-32 characters, ten of
 *          time in milliseconds and sixteen of randomness that grow by one within a millisecond, so ids minted by one
 *          process sort in the order they were minted (a monotonic ULID).
 * Boundary: internal; process state is the last time and randomness. A clock that steps back keeps the last time, so
 *           order holds. Draws from `crypto.getRandomValues`, so `freezeIds()` from `@stackra/testing` makes the ids
 *           repeat in a test. Upper case, as @stackra/events' own event ids are.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids: `<prefix>_<26 characters>`); ADR 0141 (decision 2: the envelope `id`).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base-32 alphabet: no I, L, O or U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

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

/** Ten fresh random bytes as an 80-bit number. */
function freshRandom(): bigint {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(10));
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

/**
 * A fresh event id, later than every id this process minted before.
 *
 * @param time - the instant in epoch milliseconds; the system clock when absent.
 * @example
 * mintEventId(); // "evt_01JB6Z3Q0M4V9TBN1XG5RD2HC8"
 */
export function mintEventId(time: number = Date.now()): PublicId<"evt"> {
  if (time > LAST.time) {
    LAST.time = time;
    LAST.random = freshRandom();
  } else LAST.random = (LAST.random + 1n) & RANDOM_MASK;
  return `evt_${encode(BigInt(LAST.time), 10)}${encode(LAST.random, 16)}`;
}
