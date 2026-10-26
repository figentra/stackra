/**
 * Stackra file contract:
 * Purpose: `FixedTagGroupContractProps`: a group whose tags cannot be removed.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0055 (forms: one field contract); ADR 0165 (UI
 *          contract).
 */
import type { TagGroupBaseContractProps } from "#contracts/types/tag-group-base-contract-props.type";

/** A group whose tags cannot be removed. */
export interface FixedTagGroupContractProps extends TagGroupBaseContractProps {
  /** Without a removal handler the tags have no remove button, so there is no name to give it. */
  readonly onRemove?: undefined;
  /** Not used: there is no remove button. */
  readonly removeLabel?: undefined;
}
