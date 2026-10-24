/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Screen` takes: the one container a screen's content sits in, which keeps clear
 *          of the safe areas (`edges`), scrolls when the content is taller than the window (`isScrollable`) and, on a
 *          phone, lifts a focused field above the keyboard (`isKeyboardAvoiding`). Each runtime's `ScreenProps` is this
 *          plus its own base props, which pass through unchanged.
 * Boundary: types only. Web draws a `main` with the desktop title-bar and safe-area insets and has no keyboard to avoid,
 *           so it accepts `isKeyboardAvoiding` and ignores it; native draws a `View` on `react-native-safe-area-context`.
 *           A screen draws no header and no tab bar: those belong to the navigator (`NavigationHeader`, `TabBar`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1, 5 and 7); ADR 0060; WCAG
 *          2.2 SC 1.4.10 (reflow) and 2.4.1.
 */
import type { ReactNode } from "react";

import type { ScreenEdge } from "#contracts/enums/screen-edge.enum";
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";

/** Props shared by the web and native `Screen`. */
export interface ScreenContractProps extends LandmarkContractProps {
  /** What the screen shows. */
  readonly children?: ReactNode;
  /** True when the content scrolls inside the screen; false when the screen only holds it. Defaults to true. */
  readonly isScrollable?: boolean | undefined;
  /** True to lift a focused field above the on-screen keyboard. Native only; web ignores it. Defaults to true. */
  readonly isKeyboardAvoiding?: boolean | undefined;
  /** The edges kept clear of the system's own parts. Defaults to all three; pass `[]` under a navigator's header and tab bar. */
  readonly edges?: readonly ScreenEdge[] | undefined;
}
