/**
 * Stackra file contract:
 * Purpose: `useCanvasSize`, the measured width of a native chart's canvas, for the charts Skia draws by hand.
 * Boundary: a React hook over `onLayout`; zero until the first layout.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/** The canvas width and the `onLayout` that measures it. */
export function useCanvasSize(): {
  readonly width: number;
  readonly onLayout: (event: LayoutChangeEvent) => void;
} {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (event) => setWidth(event.nativeEvent.layout.width) };
}
