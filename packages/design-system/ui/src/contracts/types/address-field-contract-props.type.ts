/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AddressField` takes: a fieldset of address lines, city, region, postal code and
 *          a CountrySelect.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { AddressValue } from "#contracts/types/address-value.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `AddressField`. */
export interface AddressFieldContractProps extends FieldContractProps<AddressValue> {
  /** The countries offered; defaults to every country. */
  readonly countries?: readonly string[] | undefined;
  /** The country a new address starts on; defaults to `SA`. */
  readonly defaultCountry?: string | undefined;
}
