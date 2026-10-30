/**
 * Stackra file contract:
 * Purpose: `NATIVE_DATA_VIEW_ICONS`, the drawings of the icons the native `DataView` draws on its own (the options
 *          button, the sort directions, the views).
 * Boundary: a registry of named re-exports, merged under the app's own by `IconRegistryProvider`.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 10); data-collection plan (owner, 2026-10-29).
 */
import { defineIconRegistry } from "@stackra/icons";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from "@stackra/icons/native/lucide-icons";

/** The icons the native DataView draws on its own. */
export const NATIVE_DATA_VIEW_ICONS = defineIconRegistry({
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "layout-grid": LayoutGrid,
  list: List,
  "sliders-horizontal": SlidersHorizontal,
  x: X,
});
