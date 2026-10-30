/**
 * Stackra file contract:
 * Purpose: `PhoneValue`, a phone number as its country and its national digits, with the international form.
 * Boundary: types only; `phoneValueOf` builds it.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */

/** A phone number. */
export interface PhoneValue {
  /** The country, as an ISO 3166-1 alpha-2 code ("SA"). */
  readonly country: string;
  /** The national number, Latin digits only, without the trunk 0. */
  readonly national: string;
  /** The international form, `+` and the dial code then the national number ("+966501234567"). */
  readonly e164: string;
}
