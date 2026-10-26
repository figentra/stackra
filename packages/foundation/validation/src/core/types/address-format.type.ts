/**
 * Stackra file contract:
 * Purpose: `AddressFormat`, one Market's address rules as market-pack data (the `identity.address_format` key): the
 *          parts it requires, the shape of its region code, postal code and short address, how many lines it takes,
 *          and the order its addresses print in.
 * Boundary: a type only. `AddressFormat$` parses it out of a pack value, `address(format)` validates with it and
 *           `@stackra/i18n`'s `formatAddress` lays out with it. Nothing in code names a Market's format.
 * Runtime: isomorphic
 * Governing contract: OS-370 and COM-117; owner principle 2026-10-25 (configuration, not code); ADR 0405 (the region
 *                     format); OS tenancy G8 (STA-1269).
 */
import type { AddressField } from "#core/types/address-field.type";
import type { IdentifierFormat } from "#core/types/identifier-format.type";

/**
 * A Market's address rules.
 *
 * @example
 * const format: AddressFormat = {
 *   required: ["locality", "postalCode"],
 *   postalCode: { pattern: "^\\d{5}$" },
 *   maxLines: 2,
 *   layout: [["lines"], ["district"], ["locality", "postalCode"], ["country"]],
 * };
 */
export interface AddressFormat {
  /** The parts every address in the Market must have. */
  readonly required: readonly AddressField[];

  /** The region code's format (a US state, a province), when the Market checks it. */
  readonly region?: IdentifierFormat;

  /** The postal code's format, when the Market has postal codes. */
  readonly postalCode?: IdentifierFormat;

  /** The national short address's format, when the Market has one. */
  readonly shortCode?: IdentifierFormat;

  /** The most street lines an address takes; 1 when left out. */
  readonly maxLines?: number;

  /** Print order: each row lists the parts on one printed line, `lines` for the street lines, `country` for the country. */
  readonly layout: readonly (readonly (AddressField | "lines" | "country")[])[];
}
