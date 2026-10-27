/**
 * Stackra file contract:
 * Purpose: `PackSubject`, whose market answers a rule kind for one record: the location where the work happens
 *          (labour, food, till and tip rules), the buyer's address (sales tax, privacy, auto-renewal), the legal
 *          entity's home (registration), or the tenant's own market.
 * Boundary: an `Enum.of` value plus the type of the same name. Which key has which subject is pack data
 *           (`MarketPack.subjects`); `MarketContext.packFor` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (the subject rule); ADR 0370; ADR 0294 (decision 16: Enum); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** Whose market answers a rule kind. */
export const PackSubject = Enum.of({
  /** The market of the place where the sale or the work happens. */
  Location: "location",
  /** The market of the buyer's ship-to or billing address. */
  Buyer: "buyer",
  /** The market where the legal entity is formed or registered. */
  Entity: "entity",
  /** The tenant's own market. */
  Scope: "tenant",
});

/** One of the codes above. */
export type PackSubject = Enum.Value<typeof PackSubject>;
