/**
 * Stackra file contract:
 * Purpose: `SegmentThumb`: what `useSegmentThumb` returns: the marker's animated style and the segments' layout handler.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0329 (motion layer); STA-1371.
 */
import type { LayoutChangeEvent } from "react-native";
import type { useAnimatedStyle } from "react-native-reanimated";

/** What `useSegmentThumb` returns. */
export interface SegmentThumb {
  /** The marker's animated position and width. */
  thumbStyle: ReturnType<typeof useAnimatedStyle>;
  /** The layout handler each segment calls with its key. */
  onSegmentLayout: (key: string, event: LayoutChangeEvent) => void;
}
