/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaType`: its codes are the IANA media types a browser reports, in source order, and SVG
 *          is not one of them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MediaType } from "#core/enums/media-type.enum";

describe("MediaType", () => {
  it("lists the IANA media types", () => {
    expect(Enum.values(MediaType)).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "application/pdf",
      "video/mp4",
    ]);
  });

  it("matches a browser's File.type", () => {
    expect(new File(["x"], "front.jpg", { type: MediaType.Jpeg }).type).toBe(MediaType.Jpeg);
  });

  it("leaves SVG out", () => {
    expect(Enum.values(MediaType)).not.toContain("image/svg+xml");
    expectTypeOf<MediaType>().toEqualTypeOf<
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/avif"
      | "image/gif"
      | "application/pdf"
      | "video/mp4"
    >();
  });
});
