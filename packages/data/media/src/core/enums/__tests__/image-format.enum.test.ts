/**
 * Stackra file contract:
 * Purpose: unit tests of `ImageFormat`: the four delivery formats, whose codes are the `format` values of a variant URL.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ImageFormat } from "#core/enums/image-format.enum";

describe("ImageFormat", () => {
  it("lists webp, avif, jpeg and png", () => {
    expect(Enum.values(ImageFormat)).toEqual(["webp", "avif", "jpeg", "png"]);
    expect(ImageFormat.Webp).toBe("webp");
    expectTypeOf<ImageFormat>().toEqualTypeOf<"webp" | "avif" | "jpeg" | "png">();
  });
});
