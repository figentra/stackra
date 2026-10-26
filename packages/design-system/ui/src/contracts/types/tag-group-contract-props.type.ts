/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TagGroup` takes: the field contract over the selected keys (label, description,
 *          error message, states, value and change handler) plus the tags, the selection mode, size, variant, the message
 *          for an empty group and the removal handler with the spoken name of each remove button. Each runtime's
 *          `TagGroupProps` is this plus its HeroUI tag group's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0165 (UI contract).
 */
import type { FixedTagGroupContractProps } from "#contracts/types/fixed-tag-group-contract-props.type";
import type { RemovableTagGroupContractProps } from "#contracts/types/removable-tag-group-contract-props.type";

/** Props shared by the web and native `TagGroup`: a removable group names its remove buttons. */
export type TagGroupContractProps = FixedTagGroupContractProps | RemovableTagGroupContractProps;
