/**
 * Stackra file contract:
 * Purpose: `RemovableTagGroupContractProps`: a group whose tags can be removed.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0055 (forms: one field contract); ADR 0165 (UI
 *          contract).
 */
import type { TagGroupBaseContractProps } from "#contracts/types/tag-group-base-contract-props.type";

/** A group whose tags can be removed: every remove button needs a spoken name. */
export interface RemovableTagGroupContractProps extends TagGroupBaseContractProps {
  /** Called with the keys of the tags the user removed; the app drops them from `items`. */
  readonly onRemove: (keys: readonly string[]) => void;
  /** The spoken name of a tag's remove button, from the tag's text, for example "Remove Travel". */
  readonly removeLabel: (tagLabel: string) => string;
}
