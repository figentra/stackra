/**
 * Stackra file contract:
 * Purpose: `checkDocuments`, the fiscal documents a guest check paid in parts issues under the pack's mode: one per
 *          paid part (its own lines, tenders and totals), or one for the whole check once the parts cover it.
 * Boundary: a pure function. Split arithmetic and tax stay upstream: a part's totals are the sums of the lines the
 *           host gave it, never a prorated share. The till driver the pack names seals what this returns, so the same
 *           code serves a ZATCA simplified invoice, an ETA e-receipt and every EU till driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); Mezzora guest_checks spec (RES-150, RES-216).
 */
import { Money } from "@stackra/money";

import { CheckDocumentMode } from "#contracts/enums/check-document-mode.enum";
import type { FiscalCheck } from "#contracts/types/fiscal-check.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";

/**
 * The documents to seal now, in order; `whole_check` answers none until the parts' tenders reach the check's gross.
 *
 * @example
 * for (const document of checkDocuments(check, mandate.checkDocument)) await fiscal.seal(document, target);
 * @throws FiscalDocumentInvalidError when `per_part` meets a part without lines (a split by amount the host did not
 *   turn into lines).
 */
export function checkDocuments(check: FiscalCheck, mode: CheckDocumentMode): FiscalDocument[] {
  const { document, parts } = check;
  const zero = Money.zero(document.currency);
  if (mode === CheckDocumentMode.WholeCheck) {
    const payments = parts.flatMap((part) => part.payments);
    const paid = payments.reduce((sum, payment) => sum.plus(payment.amount), zero);
    return paid.minor < document.gross.minor ? [] : [{ ...document, payments }];
  }
  return parts.map((part, index) => {
    if (!part.lines?.length)
      throw FiscalDocumentInvalidError.create({ driver: "check", field: `parts.${index}.lines` });
    const net = part.lines.reduce((sum, line) => sum.plus(line.net), zero);
    const tax = part.lines.reduce((sum, line) => sum.plus(line.tax), zero);
    return {
      ...document,
      id: part.id,
      number: part.number,
      issuedAt: part.paidAt,
      lines: part.lines,
      payments: part.payments,
      net,
      tax,
      gross: net.plus(tax),
    };
  });
}
