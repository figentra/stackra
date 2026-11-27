/**
 * Stackra file contract:
 * Purpose: property tests of `mintPublicId`: for any prefix and any sequence of clock readings, forward, repeated or
 *          stepping back, every id is a well-formed public id of that prefix, sorts after every id minted before it,
 *          and encodes a UUIDv7 (version 7, variant 10) whose 48-bit time is never before the reading it was given.
 * Boundary: test only; fast-check generates the prefixes and clock readings. The minter's process state carries across
 *           runs, which is the condition the ordering property must hold under.
 * Runtime: node (vitest)
 * Governing contract: ADR 0135 (decision 1: format); ADR 0182 (unit tier); ADR 0022; ADR 0269; STA-2887.
 */
import { describe, expect, it } from "@stackra/testing";
import * as fc from "fast-check";

import { isPublicId } from "#core/functions/is-public-id.function";
import { mintPublicId } from "#core/functions/mint-public-id.function";

/** Crockford's base32 alphabet, lowercase. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** The 128-bit value of a public id's 26-character body. */
function valueOf(id: string): bigint {
  let value = 0n;
  for (const character of id.slice(id.indexOf("_") + 1))
    value = (value << 5n) | BigInt(ALPHABET.indexOf(character));
  return value;
}

/** A registered-style prefix: 2 to 6 lowercase letters. */
const prefix = fc.stringMatching(/^[a-z]{2,6}$/);

/** Clock readings in epoch milliseconds, anywhere in the 48-bit range, in any order. */
const readings = fc.array(
  fc.oneof(
    fc.integer({ min: 0, max: 2 ** 48 - 1 }),
    fc.integer({ min: 1_700_000_000_000, max: 1_700_000_000_010 }),
  ),
  { minLength: 1, maxLength: 40 },
);

describe("mintPublicId (properties)", () => {
  it("mints well-formed UUIDv7 public ids that sort in minting order, whatever the clock does", () => {
    fc.assert(
      fc.property(prefix, readings, (name, times) => {
        let previous = "";
        for (const time of times) {
          const id = mintPublicId(name, time);
          const value = valueOf(id);
          expect(isPublicId(id, name)).toBe(true);
          expect(value >> 128n).toBe(0n);
          expect((value >> 76n) & 0xfn).toBe(7n);
          expect((value >> 62n) & 0b11n).toBe(0b10n);
          expect(value >> 80n >= BigInt(time)).toBe(true);
          expect(id > previous).toBe(true);
          previous = id;
        }
      }),
    );
  });
});
