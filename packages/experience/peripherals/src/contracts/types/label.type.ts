/**
 * Stackra file contract:
 * Purpose: `Label`, a label print job: its id, how many copies, and either a ZPL document or a raster image.
 * Boundary: a type only. A ZPL document comes from a studio label template (data), and is checked by the bridge before
 *           it reaches a printer from the renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decisions 1, 2 and 7).
 */
import type { LabelFormat } from "#contracts/enums/label-format.enum";
import type { RasterImage } from "#contracts/types/raster-image.type";

/** A label to print. */
export type Label =
  | {
      /** The job's id; the printed result names it back. */
      readonly jobId: string;
      /** Copies to print, at least one. */
      readonly copies: number;
      readonly format: typeof LabelFormat.Zpl;
      /** The ZPL II document, `^XA` to `^XZ`. */
      readonly zpl: string;
    }
  | {
      readonly jobId: string;
      readonly copies: number;
      readonly format: typeof LabelFormat.Raster;
      /** The image to print. */
      readonly raster: RasterImage;
    };
