/**
 * Stackra file contract:
 * Purpose: unit tests of `imageVariantUrl`: the template's 480px WebP card URL, height, relative URLs, an existing
 *          query and a fragment, and a refused box.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { ImageFormat } from "#core/enums/image-format.enum";
import { imageVariantUrl } from "#core/functions/image-variant-url.function";

describe("imageVariantUrl", () => {
  it("writes the template card's form", () => {
    expect(
      imageVariantUrl("https://cdn.test/tee.jpg", { width: 480, format: ImageFormat.Webp }),
    ).toBe("https://cdn.test/tee.jpg?w=480&format=webp");
  });

  it("adds the height between the width and the format", () => {
    expect(
      imageVariantUrl("https://cdn.test/tee.jpg", {
        width: 480,
        height: 320,
        format: ImageFormat.Avif,
      }),
    ).toBe("https://cdn.test/tee.jpg?w=480&h=320&format=avif");
  });

  it("works on a relative URL and keeps a query and a fragment", () => {
    expect(imageVariantUrl("/media/tee.jpg", { width: 96 })).toBe("/media/tee.jpg?w=96");
    expect(imageVariantUrl("https://cdn.test/tee.jpg?v=2#top", { width: 96 })).toBe(
      "https://cdn.test/tee.jpg?v=2&w=96#top",
    );
  });

  it("refuses a box that is not whole pixels", () => {
    expect(() => imageVariantUrl("https://cdn.test/tee.jpg", { width: 0 })).toThrow(RangeError);
  });
});
