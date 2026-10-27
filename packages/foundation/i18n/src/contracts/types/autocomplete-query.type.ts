/**
 * Stackra file contract:
 * Purpose: `AutocompleteQuery`, what `AddressAutocomplete#suggest` is asked as a person types: the partial text, the
 *          session the keystrokes belong to (providers bill a session once), the language and the countries.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: OS-182; ADR 0305.
 */
import type { GeoPoint } from "@stackra/contracts";
import type { CountryCode } from "@stackra/validation";

/** One keystroke's request. */
export interface AutocompleteQuery {
  /** What is typed so far. */
  readonly text: string;

  /** One id for every keystroke of one address entry and its final `resolve`. */
  readonly session: string;

  /** The BCP 47 language of the suggestions. */
  readonly locale: string;

  /** Only suggestions in these countries. */
  readonly countries?: readonly CountryCode[];

  /** Prefer suggestions near this point. */
  readonly near?: GeoPoint;
}
