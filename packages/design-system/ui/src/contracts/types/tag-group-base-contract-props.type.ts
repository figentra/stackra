/**
 * Stackra file contract:
 * Purpose: `TagGroupBaseContractProps`: the props of a TagGroup whatever its removal.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0055 (forms: one field contract); ADR 0165 (UI
 *          contract).
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
