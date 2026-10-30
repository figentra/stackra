/**
 * Stackra file contract:
 * Purpose: `PaginationIndicatorProps`: props of `PaginationIndicator`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { SharedValue } from "react-native-reanimated";

/** Props of {@link PaginationIndicator}. */
export interface PaginationIndicatorProps {
  /** The page this mark stands for, counted from 0. */
  readonly index: number;
  /** The page's caption, shown while it is the current page. */
  readonly label: string;
  /** The pager's scroll offset, in points. */
  readonly scrollY: SharedValue<number>;
  /** The height of one page, in points. */
  readonly pageHeight: number;
  /** True to skip the scaling of the mark (reduced motion). */
  readonly isStatic: boolean;
  /** Jumps the pager to this page. */
  readonly onPress: () => void;
}
