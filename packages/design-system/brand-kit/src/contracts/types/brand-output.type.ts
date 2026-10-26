/**
 * Stackra file contract:
 * Purpose: `BrandOutput`, one file the generator plans, relative to the output folder: a text file written as it is,
 *          a PNG rasterised from an SVG at one width, or an ICO packing the PNGs of one SVG at several sizes.
 * Boundary: type only. Planning is pure (`planBrand`); rasterising and writing are the node entry's.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5: generated sets are build artefacts).
 */

/** One planned file. */
export type BrandOutput =
  | {
      /** Written as it is. */
      readonly kind: "text";
      /** The path under the output folder. */
      readonly path: string;
      /** The file's text. */
      readonly text: string;
    }
  | {
      /** Rasterised from `svg`. */
      readonly kind: "png";
      /** The path under the output folder. */
      readonly path: string;
      /** The source SVG. */
      readonly svg: string;
      /** The width in pixels; the height follows the SVG's aspect. */
      readonly width: number;
    }
  | {
      /** One PNG of `svg` per size, packed in an ICO. */
      readonly kind: "ico";
      /** The path under the output folder. */
      readonly path: string;
      /** The source SVG, square. */
      readonly svg: string;
      /** The sizes in pixels, each at most 256. */
      readonly sizes: readonly number[];
    };
