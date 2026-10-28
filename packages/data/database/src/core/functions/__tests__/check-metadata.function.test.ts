/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMetadata` and `hasMetadata`: a string bag up to 16 KB passes; a non-object, a
 *          non-string value or a bag over 16 KB (counted in UTF-8 bytes) is refused with its reason.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0321 (decision 4); ADR 0022; data-layer gap mo18.
 */
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import type { MetadataInvalidError } from "#core/errors/metadata-invalid.error";
import { checkMetadata } from "#core/functions/check-metadata.function";
import { hasMetadata } from "#core/functions/has-metadata.function";
import { HasMetadata } from "#core/traits/has-metadata.trait";

/** The reason `metadata` is refused, or undefined when it passes. */
function reason(metadata: unknown): string | undefined {
  try {
    checkMetadata("Customer", metadata);
    return undefined;
  } catch (error) {
    return (error as MetadataInvalidError).reason;
  }
}

describe(checkMetadata, () => {
  it("passes a string bag up to 16 KB", () => {
    expect(reason({})).toBeUndefined();
    expect(reason({ crmId: "0031x" })).toBeUndefined();
    // `{"k":"…"}` is 8 bytes of JSON around the value.
    expect(reason({ k: "a".repeat(16_384 - 8) })).toBeUndefined();
  });

  it("refuses anything else with its reason", () => {
    for (const value of [null, undefined, "x", 1, ["a"]]) expect(reason(value)).toBe("not_object");
    expect(reason({ count: 3 })).toBe("value_not_string");
    expect(reason({ nested: { a: "b" } })).toBe("value_not_string");
    expect(reason({ k: "a".repeat(16_384 - 7) })).toBe("too_large");
    // Two bytes per character in UTF-8: counted in bytes, not characters.
    expect(reason({ k: "é".repeat(8200) })).toBe("too_large");
  });
});

describe(hasMetadata, () => {
  it("reads the trait", () => {
    class Customer extends Model.with(HasPublicId("cus"), HasMetadata) {}
    class Note extends Model.with(HasPublicId("not")) {}
    expect(hasMetadata(Customer)).toBe(true);
    expect(hasMetadata(Note)).toBe(false);
  });
});
