/**
 * Stackra file contract:
 * Purpose: `mintPublicId(prefix, time?)`, the one public-id minter: the prefix, `_`, and the 26 lowercase Crockford
 *          base32 characters of a fresh UUIDv7. Ids minted by one process sort in minting order, also within one
 *          millisecond and after the clock steps back (RFC 9562 method 2: the 74 random bits grow by one).
 * Boundary: process state is the last millisecond and random bits. Reads `Date.now()` and `crypto.getRandomValues`
 *           only, so `freezeClock` and `freezeIds` make the random part repeat in a test. It does not check the
 *           prefix (the `HasPublicId` trait and gen do). Model ids, action and outbox event ids (`evt_`) all come from
 *           here (STA-1380); stored ids of the older forms stay valid, since consumers compare ids as strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1: format); ADR 0082 (database ids never leave a service); ADR 0141
 *                     (decision 2: the envelope id).
 */
import type { PublicId } from "#core/types/public-id.type";

/** Crockford's base32 alphabet, lowercase: no i, l, o or u. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** A UUIDv7 keeps 74 random bits: 12 in `rand_a`, 62 in `rand_b`. */
const RANDOM_BITS = 74n;

/** The last millisecond and random bits minted. */
const LAST = { time: -1, random: 0n };

/** Fresh random bits from ten random bytes. */
function freshRandom(): bigint {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(10));
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value >> (80n - RANDOM_BITS);
}

/**
 * A new public id with `prefix`, later than every id this process minted before.
 *
 * @param prefix - 2 to 6 lowercase letters registered in the manifest (ADR 0135 decision 2).
 * @param time - the instant in epoch milliseconds; the system clock when absent.
 * @example
 * mintPublicId("ord"); // "ord_01jab3k4m5n6p7q8r9s0t1v2w3"
 * mintPublicId("evt", occurredAt.getTime());
 */
export function mintPublicId<P extends string>(prefix: P, time: number = Date.now()): PublicId<P> {
  if (time > LAST.time) {
    LAST.time = time;
    LAST.random = freshRandom();
  } else {
    LAST.random += 1n;
    // The random bits ran out within one millisecond: borrow the next one, as RFC 9562 allows.
    if (LAST.random >> RANDOM_BITS !== 0n) {
      LAST.time += 1;
      LAST.random = freshRandom();
    }
  }
  // UUIDv7 (RFC 9562): 48-bit milliseconds, version 7, rand_a, variant 10, rand_b.
  let value =
    (BigInt(LAST.time) << 80n) |
    (7n << 76n) |
    ((LAST.random >> 62n) << 64n) |
    (2n << 62n) |
    (LAST.random & ((1n << 62n) - 1n));
  let body = "";
  for (let index = 0; index < 26; index++) {
    body = ALPHABET.charAt(Number(value & 31n)) + body;
    value >>= 5n;
  }
  return `${prefix}_${body}`;
}
