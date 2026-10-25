/**
 * Stackra file contract:
 * Purpose: `PartyKind`, who a seller or buyer is in tax terms: a registered business, a private person, or a foreign
 *          party.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry; drivers map it to their format's
 *           party type. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * A simplified receipt usually has no buyer at all; a buyer present on one is a `person`.
 *
 * @example
 * const buyer = { kind: PartyKind.Business, name: "Acme", taxId, registration: null, address, endpoint: null };
 */
export const PartyKind = Enum.of({
  /** A business registered for tax in the document's market. */
  Business: "business",
  /** A private person. */
  Person: "person",
  /** A party registered in another market. */
  Foreign: "foreign",
});

/** One of the codes above. */
export type PartyKind = Enum.Value<typeof PartyKind>;
