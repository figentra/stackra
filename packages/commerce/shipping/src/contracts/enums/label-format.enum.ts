/**
 * Stackra file contract:
 * Purpose: `LabelFormat`, the document formats a carrier label comes in: PDF for office printers and ZPL for thermal
 *          label printers.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Which format and stock a location
 *           prints is that location's printer setting, passed in each `LabelRequest`. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 5); ADR 0339 (ZPL printing is `@stackra/peripherals`' `LabelPrinter`).
 */
import { Enum } from "@stackra/contracts";

/**
 * Label document formats.
 *
 * @example
 * const shipment = await gateway.createLabel({ ...request, format: LabelFormat.Zpl });
 */
export const LabelFormat = Enum.of({
  /** A PDF document, one or more pages. */
  Pdf: "pdf",
  /** Zebra Programming Language: one or more `^XA … ^XZ` label formats as text. */
  Zpl: "zpl",
});

/** One of the codes above. */
export type LabelFormat = Enum.Value<typeof LabelFormat>;
