/**
 * Stackra file contract:
 * Purpose: the props every runtime's `PhoneField` takes: a country (with its dial code) and the national number.
 * Boundary: types only; the number is not checked against a numbering plan (no libphonenumber), only its length.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { PhoneValue } from "#contracts/types/phone-value.type";

/** Props shared by the web and native `PhoneField`. */
export interface PhoneFieldContractProps extends FieldContractProps<PhoneValue | null> {
  /** The country the field starts on; defaults to `SA`. A market pack sets it. */
  readonly defaultCountry?: string | undefined;
  /** The countries offered, as ISO codes; defaults to every country with a known dial code. */
  readonly countries?: readonly string[] | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
}
