/**
 * Stackra file contract:
 * Purpose: `EdiSyntax`, the two interchange syntaxes the EDI envelope reads and writes: ASC X12 (ISA, GS, ST) and
 *          UN/EDIFACT (UNA, UNB, UNH).
 * Boundary: an `Enum.of` value plus the type of the same name. GS1 XML is not an envelope syntax here; a network that
 *           takes it is a connector of its own (stackra-45).
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6: our own X12 and EDIFACT engine); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The interchange syntaxes.
 *
 * @example
 * const options = { syntax: EdiSyntax.X12, sender: "ZZ:FIGENTRA", version: "00401", test: true };
 */
export const EdiSyntax = Enum.of({
  /** ASC X12: ISA and IEA, GS and GE, ST and SE. */
  X12: "x12",
  /** UN/EDIFACT: UNA, UNB and UNZ, UNH and UNT. */
  Edifact: "edifact",
});

/** One of the codes above. */
export type EdiSyntax = Enum.Value<typeof EdiSyntax>;
