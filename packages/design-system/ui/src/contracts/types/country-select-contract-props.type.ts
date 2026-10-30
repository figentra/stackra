/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CountrySelect` takes: one country, by ISO code, from a searchable list named
 *          in the active language.
 * Boundary: types only; the names are Intl's.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `CountrySelect`. */
export interface CountrySelectContractProps extends FieldContractProps<string | null> {
  /** The countries offered, as ISO 3166-1 alpha-2 codes; defaults to every country. Listed first: `preferred`. */
  readonly countries?: readonly string[] | undefined;
  /** Countries pinned at the top of the list, for example the market's own. */
  readonly preferred?: readonly string[] | undefined;
  /** Text shown while nothing is chosen. */
  readonly placeholder?: string | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
}
