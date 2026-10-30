/**
 * Stackra file contract:
 * Purpose: `THEME_TRANSITIONS`: the transitions Uniwind Pro draws on a theme change, each with its catalogue key (`settings::settings.transitions.<key>`).
 * Boundary: data only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0310 (decision 11, Uniwind Pro).
 */
import { ThemeTransitionPreset } from "uniwind";

/** The transitions on offer, in the order the picker lists them. */
export const THEME_TRANSITIONS: readonly { id: ThemeTransitionPreset; key: string }[] = [
  { id: ThemeTransitionPreset.CircleFromOrigin, key: "circle_from_tap" },
  { id: ThemeTransitionPreset.SlideFromOrigin, key: "slide_from_tap" },
  { id: ThemeTransitionPreset.BlurFromOrigin, key: "blur_from_tap" },
  { id: ThemeTransitionPreset.Fade, key: "fade" },
  { id: ThemeTransitionPreset.Blur, key: "blur" },
  { id: ThemeTransitionPreset.CircleCenter, key: "circle_centre" },
  { id: ThemeTransitionPreset.CircleTopLeft, key: "circle_top_left" },
  { id: ThemeTransitionPreset.CircleTopRight, key: "circle_top_right" },
  { id: ThemeTransitionPreset.CircleBottomLeft, key: "circle_bottom_left" },
  { id: ThemeTransitionPreset.CircleBottomRight, key: "circle_bottom_right" },
  { id: ThemeTransitionPreset.SlideLeftToRight, key: "slide_left_to_right" },
  { id: ThemeTransitionPreset.SlideRightToLeft, key: "slide_right_to_left" },
  { id: ThemeTransitionPreset.BlurLeftToRight, key: "blur_left_to_right" },
  { id: ThemeTransitionPreset.BlurRightToLeft, key: "blur_right_to_left" },
  { id: ThemeTransitionPreset.None, key: "none" },
];
