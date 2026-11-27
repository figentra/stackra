/**
 * Stackra file contract:
 * Purpose: property tests of the stored form of public ids: any UUID, in any case and with or without hyphens,
 *          round-trips through `uuidToPublicId` and `publicIdToUuid`; the encoding keeps UUID order, so ids sort as
 *          their rows do; every minted id decodes to a UUIDv7; and any string is either decoded or refused with a
 *          `TypeError`, never another error.
 * Boundary: test only; fast-check generates the UUIDs, prefixes and strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0135 (decision 1 and the 2026-10-28 amendment); ADR 0182 (unit tier); ADR 0022; ADR 0269;
 *                     STA-2887.
 */
import { mintPublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import * as fc from "fast-check";

import { publicIdToUuid } from "#core/functions/public-id-to-uuid.function";
import { uuidToPublicId } from "#core/functions/uuid-to-public-id.function";

/** A 128-bit value as a canonical lowercase UUID. */
function uuidOf(value: bigint): string {
  const hex = value.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Any 128-bit value, the edges included. */
const bits = fc.oneof(
  fc.bigInt({ min: 0n, max: (1n << 128n) - 1n }),
  fc.constantFrom(0n, 1n, (1n << 128n) - 1n, 1n << 127n),
);

/** A public id prefix: 2 to 6 lowercase letters. */
const prefix = fc.stringMatching(/^[a-z]{2,6}$/);

describe("public id storage (properties)", () => {
  it("round-trips any UUID, whatever its case and hyphens", () => {
    fc.assert(
      fc.property(bits, prefix, fc.boolean(), fc.boolean(), (value, name, upper, compact) => {
        const uuid = uuidOf(value);
        const written = compact ? uuid.replaceAll("-", "") : uuid;
        const id = uuidToPublicId(name, upper ? written.toUpperCase() : written);
        expect(id).toMatch(new RegExp(`^${name}_[0-9a-hjkmnp-tv-z]{26}$`));
        expect(publicIdToUuid(id)).toBe(uuid);
      }),
    );
  });

  it("keeps UUID order, so public ids sort as their rows do", () => {
    fc.assert(
      fc.property(bits, bits, (left, right) => {
        const [a, b] = [uuidToPublicId("ord", uuidOf(left)), uuidToPublicId("ord", uuidOf(right))];
        expect(a < b).toBe(left < right);
      }),
    );
  });

  it("decodes every minted id to a UUIDv7 that encodes back to it", () => {
    fc.assert(
      fc.property(prefix, fc.integer({ min: 0, max: 2 ** 48 - 1 }), (name, time) => {
        const id = mintPublicId(name, time);
        const uuid = publicIdToUuid(id);
        expect(uuid.charAt(14)).toBe("7");
        expect("89ab").toContain(uuid.charAt(19));
        expect(uuidToPublicId(name, uuid)).toBe(id);
      }),
    );
  });

  it("decodes any string or refuses it with a TypeError, never another error", () => {
    const body = fc.stringMatching(/^[0-9a-hjkmnp-tv-z]{26}$/);
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.string({ unit: "binary" }),
          body.map((text) => `usr_${text}`),
        ),
        (text) => {
          let decoded: string | undefined;
          try {
            decoded = publicIdToUuid(text);
          } catch (error) {
            expect(error).toBeInstanceOf(TypeError);
            return;
          }
          // a decoded id is exactly the encoding of its UUID: the body's first character carries at most 3 bits
          expect(uuidToPublicId(text.slice(0, text.indexOf("_")), decoded)).toBe(text);
        },
      ),
    );
  });
});
