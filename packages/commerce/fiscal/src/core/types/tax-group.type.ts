/**
 * Stackra file contract:
 * Purpose: `TaxGroup`, the lines of a document that share one tax category, rate and exemption, summed: the per-rate
 *          breakdown
 *          every format prints.
 * Boundary: a type only; `taxBreakdown` builds the list.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 9).
 */
import type { Money } from "@stackra/money";

/** One category and rate with its summed net and tax. */
export type TaxGroup = {
  /** UNCL 5305 category. */
  readonly category: string;
  /** Rate in percent as a decimal string. */
  readonly rate: string;
  /** The lines' shared exemption; `null` for a standard rate. */
  readonly exemption: { readonly code: string; readonly reason: string } | null;
  /** Sum of the lines' nets. */
  readonly net: Money;
  /** Sum of the lines' taxes. */
  readonly tax: Money;
};
