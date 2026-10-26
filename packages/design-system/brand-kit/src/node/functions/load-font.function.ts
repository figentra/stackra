/**
 * Stackra file contract:
 * Purpose: `loadFont(file)`, a font file parsed by opentype.js, once per file per process.
 * Boundary: reads the file; ttf, otf and woff only (opentype.js 1.x does not read woff2). The fonts are the product's
 *           or the design record's; this package ships none.
 * Runtime: node
 * Governing contract: ADR 0340 decision 10 (the outliner); ported from figentra/os `tools/brand-kit/lib/outline.mjs`
 *                     (ORIGIN.md).
 */
import { readFileSync } from "node:fs";

import opentype from "opentype.js";

/** Parsed fonts by file. */
const FONTS = new Map<string, ReturnType<typeof opentype.parse>>();

/**
 * The parsed font in `file`.
 *
 * @throws Error when the file cannot be read or parsed.
 * @example
 * const font = loadFont("assets/brand/fonts/Geist-SemiBold.otf");
 */
export function loadFont(file: string): ReturnType<typeof opentype.parse> {
  let font = FONTS.get(file);
  if (font === undefined) {
    const bytes = readFileSync(file);
    font = opentype.parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    FONTS.set(file, font);
  }
  return font;
}
