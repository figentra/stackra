/**
 * Stackra file contract:
 * Purpose: `useAxisLabels`, the Victory Native label renderer the native cartesian charts draw axis ticks with: Skia's
 *          Paragraph API (shaping and bidi, so Arabic joins and reads right to left), 10pt, muted, one centred line.
 * Boundary: a React hook memoising the renderer per colour.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); arabic rendering rules (Skia text through Paragraph); STA-1371.
 */
import { Skia, TextAlign } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { createParagraphLabelRenderer } from "victory-native";

/** The width allowed per character of an axis label at 10 points. */
const LABEL_CHAR_WIDTH = 6.5;

/**
 * The tick label renderer in `color`.
 * @param color - the labels' colour
 * @param slotWidth - the room each label has, when the axis is crowded: a longer label ends in an ellipsis instead of
 *   running into its neighbours
 */
export function useAxisLabels(
  color: string,
  slotWidth?: number,
): ReturnType<typeof createParagraphLabelRenderer> {
  return useMemo(
    () =>
      createParagraphLabelRenderer({
        paragraphStyle: { maxLines: 1, ellipsis: "…", textAlign: TextAlign.Center },
        // oxlint-disable-next-line react/capitalized-calls -- Skia.Color is Skia's colour parser, a namespace method, not a component
        textStyle: { fontSize: 10, color: Skia.Color(color) },
        maxWidth: ({ text }) =>
          Math.min(text.length * LABEL_CHAR_WIDTH + 8, slotWidth ?? Number.POSITIVE_INFINITY),
      }),
    [color, slotWidth],
  );
}
