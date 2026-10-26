/**
 * Stackra file contract:
 * Purpose: the part of opentype.js 1.3.4 this package uses: `parse` of a font's bytes, and a font's `getPath`,
 *          `getAdvanceWidth`, `unitsPerEm` and OS/2 table. opentype.js ships no types of its own.
 * Boundary: an ambient declaration for the `./node` entry only.
 * Runtime: node
 * Governing contract: ADR 0340 decision 10 (the outliner).
 */
declare module "opentype.js" {
  /** One path command, y down. */
  interface PathCommand {
    readonly type: string;
    readonly x?: number;
    readonly y?: number;
    readonly x1?: number;
    readonly y1?: number;
    readonly x2?: number;
    readonly y2?: number;
  }

  /** A shaped line's outline. */
  interface Path {
    readonly commands: readonly PathCommand[];
    getBoundingBox(): { x1: number; y1: number; x2: number; y2: number };
  }

  /** Layout options; `letterSpacing` is in em. */
  interface RenderOptions {
    readonly kerning?: boolean;
    readonly letterSpacing?: number;
  }

  /** A parsed font. */
  interface Font {
    readonly unitsPerEm: number;
    readonly tables: {
      readonly os2?: { readonly sCapHeight?: number; readonly sxHeight?: number };
    };
    getPath(text: string, x: number, y: number, fontSize: number, options?: RenderOptions): Path;
    getAdvanceWidth(text: string, fontSize: number, options?: RenderOptions): number;
  }

  /** Parses a ttf, otf or woff font (not woff2). */
  export function parse(buffer: ArrayBuffer): Font;

  const opentype: { parse: typeof parse };
  export default opentype;
}
