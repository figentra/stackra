/**
 * Stackra file contract:
 * Purpose: `CatalogueProposal`, what an admin submits to change one plan-catalogue record: the record key and kind, the
 *          new rows, the date they apply from, and whether the change is a discount.
 * Boundary: a type only; `PlanCatalogueService.propose` numbers, dates and stores it. `discount` comes from the
 *           record's own reader (`@stackra/pricing`'s `isCatalogueDiscount`), never from the person proposing.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 2 to 4); owner OS-82, OS-381.
 */
import type { Json } from "@stackra/contracts";

/** One proposed change. */
export interface CatalogueProposal {
  /** The record key (`offer:founding`). */
  readonly key: string;

  /** The record kind (`offer`). */
  readonly kind: string;

  /** The record's new rows. */
  readonly rows: readonly Readonly<Record<string, Json>>[];

  /** The first instant a starting or renewing term picks the change up; never before now. */
  readonly effectiveFrom: Date;

  /** Whether the change lowers a price or grants a benefit. */
  readonly discount: boolean;
}
