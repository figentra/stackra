/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ListItem` takes: a row with a title and an optional description, a start icon or
 *          avatar, trailing content, a chevron and a press action. `ListItemData` is the same row as an entry of a
 *          `List`'s `items`, which adds the `id` the list keys and selects it by. Each runtime's `ListItemProps` is this
 *          plus its own row element's props, which pass through unchanged.
 * Boundary: types only. A row presses or it selects, never both: while its list selects, `onPress` is not called.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (text slots).
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `ListItem`. */
export interface ListItemContractProps {
  /** The row's main text, or any node when the row needs more than text. */
  readonly title: ReactNode;
  /** The muted line under the title. */
  readonly description?: ReactNode;
  /** The leading visual: an icon by name, or an element drawn as given, usually an `Avatar`. */
  readonly startIcon?: IconSlot | undefined;
  /** What the row shows at its end, before the chevron: a `Chip`, a value, a switch. */
  readonly endContent?: ReactNode;
  /** Draws a chevron at the end that points the reading way, to say that the row opens something. */
  readonly hasChevron?: boolean | undefined;
  /** Makes the row a button and is called when it is pressed; without it the row is plain content. */
  readonly onPress?: (() => void) | undefined;
  /** Refuses the press and the selection of a row that has either, and dims it; a plain row has nothing to refuse. */
  readonly isDisabled?: boolean | undefined;
  /** The accessible name when the title is not a string; also what type-ahead matches. Defaults to the title text. */
  readonly label?: string | undefined;
}

/** A row as an entry of a list: the row's props and the `id` the list keys it and its selection by. */
export interface ListItemData extends ListItemContractProps, CollectionItem {}
