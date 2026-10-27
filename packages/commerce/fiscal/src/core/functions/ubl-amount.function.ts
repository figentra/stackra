/**
 * Stackra file contract:
 * Purpose: `ublAmount`, a UBL amount element: the decimal text of a `Money` with its `currencyID`.
 * Boundary: a pure function over `xmlElement`; the decimal is `Money.toDecimal`, never re-rounded.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); ADR 0220 (money).
 */
import type { Money } from "@stackra/money";

import { xmlElement } from "#core/functions/xml-element.function";
import type { XmlNode } from "#core/types/xml-node.type";

/**
 * Builds a UBL amount element, `<name currencyID="…">decimal</name>`.
 *
 * @example
 * ublAmount("cbc:PayableAmount", document.gross);
 */
export function ublAmount(name: string, amount: Money): XmlNode {
  return xmlElement(name, { currencyID: amount.currency }, amount.toDecimal());
}
