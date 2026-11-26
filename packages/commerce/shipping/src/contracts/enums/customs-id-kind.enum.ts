/**
 * Stackra file contract:
 * Purpose: `CustomsIdKind`, the kinds of customs and tax identifier a shipper puts on a cross-border label: EORI,
 *          IOSS, EIN and a VAT number.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Which identifiers a shipment needs is
 *           the destination's rule, applied by the caller; a connector sends the ones its carrier takes. Codes are
 *           snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369; EU Regulation 952/2013 (EORI); EU VAT e-commerce package (IOSS).
 */
import { Enum } from "@stackra/contracts";

/**
 * Customs and tax identifier kinds.
 *
 * @example
 * const id: CustomsId = { kind: CustomsIdKind.Ioss, value: "IM2760000742" };
 */
export const CustomsIdKind = Enum.of({
  /** The EU Economic Operators Registration and Identification number. */
  Eori: "eori",
  /** The EU Import One-Stop Shop number, for B2C goods of at most €150 sent duty paid. */
  Ioss: "ioss",
  /** The US Employer Identification Number, the shipper's tax id for US customs. */
  Ein: "ein",
  /** A VAT registration number (the UK's for goods of at most £135, for example). */
  Vat: "vat",
});

/** One of the codes above. */
export type CustomsIdKind = Enum.Value<typeof CustomsIdKind>;
