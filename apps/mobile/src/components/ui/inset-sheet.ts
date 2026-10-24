/**
 * Stackra file contract:
 * Purpose: HeroUI's inset bottom-sheet style (detached, lifted above the home indicator, side margins, rounder
 *          corners), as props to spread on any `*.Content presentation="bottom-sheet"`, so every sheet of the review
 *          area looks the same. The pattern of the heroui-native example app's detached bottom sheet.
 * Boundary: props only; no component of its own.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); owner decision of 2026-10-24 (inset sheets).
 */
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** The gap between the sheet and the bottom safe-area edge, in points. */
const SHEET_GAP = 12;

/** The inset sheet props for the current safe area: spread them on a bottom-sheet Content. */
export function useInsetSheet() {
  const { bottom } = useSafeAreaInsets();
  return {
    detached: true,
    bottomInset: bottom + SHEET_GAP,
    className: "mx-4",
    backgroundClassName: "rounded-4xl",
  } as const;
}
