/**
 * Stackra file contract:
 * Purpose: `FiscalLine`, one line of a fiscal document with its amounts and tax already computed.
 * Boundary: a type only. Tax is computed upstream (OS invoicing and pricing, from pack rates); a driver reads the line
 *           and never recomputes it. `taxCategory` is a UNCL 5305 code and `unitCode` a UN/ECE Recommendation 20
 *           code, the two lists every mandate here shares.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 8 and 9); ADR 0220 (money).
 */
import type { Money } from "@stackra/money";

/** A line; `net + tax` is the line's gross. */
export type FiscalLine = {
  /** The line's id within its document, usually its position. */
  readonly id: string;
  /** What was sold, as printed. */
  readonly description: string;
  /** Quantity sold; fractional for measured goods. */
  readonly quantity: number;
  /** UN/ECE Recommendation 20 unit code (`C62`, `KGM`). */
  readonly unitCode: string;
  /** Net price of one unit. */
  readonly unitPrice: Money;
  /** Net amount of the line. */
  readonly net: Money;
  /** Tax amount of the line. */
  readonly tax: Money;
  /** UNCL 5305 tax category (`S`, `Z`, `E`, `O`, `AE`). */
  readonly taxCategory: string;
  /** Tax rate in percent as a decimal string (`"15"`, `"5.5"`). */
  readonly taxRate: string;
  /** Why the line is exempt or zero-rated (a VATEX code and its text); `null` for a standard-rated line. */
  readonly exemption: { readonly code: string; readonly reason: string } | null;
  /** The item's registered code (a GS1 GTIN, an EGS code) and its scheme; required by some mandates. */
  readonly itemCode: { readonly scheme: string; readonly code: string } | null;
};
