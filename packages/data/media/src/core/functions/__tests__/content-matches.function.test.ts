/**
 * Stackra file contract:
 * Purpose: unit tests of `contentMatches`: each accepted media type's real head matches it and only it, an SVG or text
 *          renamed as an image matches nothing, an `ftyp` box tells AVIF (major or compatible brand) from MP4, and a
 *          head too short for a signature matches nothing.
 * Boundary: test only; heads are built from the published signatures, no file is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0222 (decision 2); STA-2644.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MediaType } from "#core/enums/media-type.enum";
import { contentMatches } from "#core/functions/content-matches.function";

/** `text` as bytes. */
const bytes = (text: string): number[] =>
  [...text].map((character) => character.codePointAt(0) ?? 0);

/** An `ftyp` box of `major`, then `compatible`, as an ISO base media file opens. */
function ftyp(major: string, compatible: readonly string[]): Uint8Array {
  const body = [...bytes("ftyp"), ...bytes(major), 0, 0, 0, 0, ...compatible.flatMap(bytes)];
  return new Uint8Array([0, 0, 0, body.length + 4, ...body]);
}

/** One real head per media type. */
const HEADS: Readonly<Record<MediaType, Uint8Array>> = {
  [MediaType.Jpeg]: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
  [MediaType.Png]: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  [MediaType.Webp]: new Uint8Array([...bytes("RIFF"), 0, 0, 0, 0, ...bytes("WEBP")]),
  [MediaType.Avif]: ftyp("avif", ["mif1", "miaf"]),
  [MediaType.Gif]: new Uint8Array(bytes("GIF89a")),
  [MediaType.Pdf]: new Uint8Array(bytes("%PDF-1.7")),
  [MediaType.Mp4]: ftyp("isom", ["iso2", "mp41"]),
};

describe("contentMatches", () => {
  it("matches each type's real head, and no other type", () => {
    for (const type of Enum.values(MediaType))
      for (const other of Enum.values(MediaType))
        expect(contentMatches(HEADS[type], other), `${type} as ${other}`).toBe(type === other);
  });

  it("refuses an SVG, text and an empty file as any image", () => {
    for (const head of [bytes('<svg xmlns="http://www.w3.org/2000/svg"/>'), bytes("hello"), []])
      for (const type of [MediaType.Png, MediaType.Jpeg, MediaType.Webp, MediaType.Gif])
        expect(contentMatches(new Uint8Array(head), type)).toBe(false);
  });

  it("tells AVIF by a compatible brand from MP4", () => {
    expect(contentMatches(ftyp("mif1", ["avif"]), MediaType.Avif)).toBe(true);
    expect(contentMatches(ftyp("mif1", ["avif"]), MediaType.Mp4)).toBe(false);
  });
});
