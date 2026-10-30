/**
 * Stackra file contract:
 * Purpose: `CategoryPagerProps`: props of `CategoryPager`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec (2026-10-27) section 3.3.
 */
import type { ComponentCategory, ComponentEntry } from "@stackra/showcase";
import type { ReactElement, ReactNode, RefObject } from "react";
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/** Props of {@link CategoryPager}. */
export interface CategoryPagerProps {
  /** The page on screen: `ALL_PAGE` or a category id. */
  readonly page: string;
  /** Called with the entry whose card was pressed. */
  readonly onOpen: (entry: ComponentEntry) => void;
  /** Called with the category whose group card was pressed. */
  readonly onOpenCategory: (category: ComponentCategory) => void;
  /** The live thumbnail of an entry, when it has a native demo. */
  readonly previewOf?: (entry: ComponentEntry) => ReactNode;
  /** What scrolls above the grid: the home's hero, count and category tabs. */
  readonly header?: ReactElement;
  /** The list's scroll handler (a Reanimated handler for the home's compact bar). */
  readonly onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** The list, for the hero's "browse" to scroll the tabs into view. */
  readonly listRef?: RefObject<FlatList<unknown> | null>;
}
