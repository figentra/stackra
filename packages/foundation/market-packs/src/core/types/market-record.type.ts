/**
 * Stackra file contract:
 * Purpose: `MarketRecord`, the markets one record (a sale, a shift, a contract) touches, one per subject: the tenant's
 *          market and, when known, the location's, the buyer's and the legal entity's.
 * Boundary: a type only; `MarketContext.packFor` picks the one its rule kind's subject names. The host fills it from
 *           the record's addresses (a market code such as `us-ca-sf`); this package never geocodes.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (the subject rule); ADR 0370.
 */

/** Market codes per subject for one record. */
export type MarketRecord = {
  /** The tenant's own market; always known. */
  readonly tenant: string;
  /** The market of the place where the sale or the work happens. */
  readonly location?: string;
  /** The market of the buyer's ship-to or billing address. */
  readonly buyer?: string;
  /** The market where the legal entity is formed or registered. */
  readonly entity?: string;
};
