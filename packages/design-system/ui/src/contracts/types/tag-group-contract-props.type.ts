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
import type { ReactNode } from "react";

import type { Size } from "#contracts/enums/size.enum";
import type { TagVariant } from "#contracts/enums/tag-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { TagItem } from "#contracts/types/tag-item.type";

/** The props of a TagGroup whatever its removal. */
export interface TagGroupBaseContractProps extends FieldContractProps<readonly string[]> {
  /** The tags, in order. Removing one is the app's job: it drops the tag from this list in `onRemove`. */
  readonly items: readonly TagItem[];
  /** What a press does: nothing, select one tag, or toggle several. Defaults to `none`, a plain list of tags. */
  readonly selectionMode?: "none" | "single" | "multiple" | undefined;
  /** The padding and text size of the tags. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The surface of the tags: `default` on the page, `surface` on a tinted card. Defaults to `default`. */
  readonly variant?: TagVariant | undefined;
  /** What the group says when it has no tags, for example "No filters"; without it an empty group draws nothing. */
  readonly emptyMessage?: ReactNode;
}

/** A group whose tags cannot be removed. */
export interface FixedTagGroupContractProps extends TagGroupBaseContractProps {
  /** Without a removal handler the tags have no remove button, so there is no name to give it. */
  readonly onRemove?: undefined;
  /** Not used: there is no remove button. */
  readonly removeLabel?: undefined;
}

/** A group whose tags can be removed: every remove button needs a spoken name. */
export interface RemovableTagGroupContractProps extends TagGroupBaseContractProps {
  /** Called with the keys of the tags the user removed; the app drops them from `items`. */
  readonly onRemove: (keys: readonly string[]) => void;
  /** The spoken name of a tag's remove button, from the tag's text, for example "Remove Travel". */
  readonly removeLabel: (tagLabel: string) => string;
}

/** Props shared by the web and native `TagGroup`: a removable group names its remove buttons. */
export type TagGroupContractProps = FixedTagGroupContractProps | RemovableTagGroupContractProps;
