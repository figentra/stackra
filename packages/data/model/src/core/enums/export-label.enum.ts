/**
 * Stackra file contract:
 * Purpose: `ExportLabel`, how an export writes the fields of a data class: every export carries the class label beside the value.
 * Boundary: an `Enum.of` value plus the type of the same name; one of the four effects a data class sets. The reader
 *           of the effect applies it; no product checks a class by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 2 and 4).
 */
import { Enum } from "@stackra/contracts";

/** The export handling of a class's fields. */
export const ExportLabel = Enum.of({
  /** Every exported value carries the class label. */
  Labelled: "labelled",
});

/** One of the codes above. */
export type ExportLabel = Enum.Value<typeof ExportLabel>;
