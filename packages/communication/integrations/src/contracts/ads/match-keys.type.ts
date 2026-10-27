/**
 * Stackra file contract:
 * Purpose: `MatchKeys`, the identifiers an ad platform matches a person by, each already normalised and SHA-256
 *          hashed (lowercase hex): the email, the phone and our own id of the person.
 * Boundary: a type only. Built by `matchKeysOf` of `.`, never by hand, so no plain email or phone reaches a connector
 *           or a provider. A key the person has none of is left out; at least one is present.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0134 (personal data); STA-793.
 */

/**
 * Hashed match keys.
 *
 * @example
 * const keys: MatchKeys = await matchKeysOf({ email: "a@b.example" }, { phone: "digits" });
 */
export interface MatchKeys {
  /** SHA-256 of the trimmed, lowercased email. */
  readonly email?: string;

  /** SHA-256 of the phone in the platform's format (`+9665…` or `9665…`). */
  readonly phone?: string;

  /** SHA-256 of our id of the person (the customer id). */
  readonly externalId?: string;
}
