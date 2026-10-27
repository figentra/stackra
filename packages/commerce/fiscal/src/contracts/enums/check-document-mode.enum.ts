/**
 * Stackra file contract:
 * Purpose: `CheckDocumentMode`, how a market issues fiscal documents for a guest check paid in parts: one document per
 *          paid part, or one document for the whole check once it is paid in full.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The mode is pack data
 *           (`FiscalMandate.checkDocument`); `checkDocuments` and `FiscalService.sealCheck` read it. Codes are
 *           snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0231 (snake_case codes); Mezzora guest_checks spec (RES-150).
 */
import { Enum } from "@stackra/contracts";

/**
 * A pack names one; the till driver the pack names seals the documents either way.
 *
 * @example
 * if (mandate.checkDocument === CheckDocumentMode.PerPart) await fiscal.sealCheck(check, target);
 */
export const CheckDocumentMode = Enum.of({
  /** Each paid part is its own fiscal document with the lines it paid for (a simplified invoice, an e-receipt). */
  PerPart: "per_part",
  /** One fiscal document for the whole check when the parts cover it; part payments print non-fiscal slips. */
  WholeCheck: "whole_check",
});

/** One of the codes above. */
export type CheckDocumentMode = Enum.Value<typeof CheckDocumentMode>;
