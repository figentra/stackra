/**
 * Stackra file contract:
 * Purpose: `AddressSuggestion`, one line of an address autocomplete list: what the person reads and the id that
 *          resolves it to a `GeocodeResult`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: OS-182; ADR 0305.
 */

/** A suggestion while typing. */
export interface AddressSuggestion {
  /** The provider's id, passed back to `AddressAutocomplete#resolve`. */
  readonly id: string;

  /** The main text (street and number, or the place's name). */
  readonly primary: string;

  /** The rest (district, city, country). */
  readonly secondary?: string;
}
