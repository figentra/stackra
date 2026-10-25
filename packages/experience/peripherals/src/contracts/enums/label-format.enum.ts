/**
 * Stackra file contract:
 * Purpose: `LabelFormat`, how a label reaches a label printer: a ZPL document (the printer lays it out) or a 1-bit
 *          raster image (any script, any layout, rendered by the caller).
 * Boundary: an `Enum.of` value plus the type of the same name; the discriminant of `Label`.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decisions 1 and 2: `LabelPrinter` takes ZPL, Arabic prints as raster); ADR 0294
 *                     (decision 16); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The forms of a label. */
export const LabelFormat = Enum.of({
  /** A ZPL II document from a label template. */
  Zpl: "zpl",
  /** A 1-bit image the printer prints dot for dot. */
  Raster: "raster",
});

/** One of the codes above. */
export type LabelFormat = Enum.Value<typeof LabelFormat>;
