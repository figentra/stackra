/**
 * Stackra file contract:
 * Purpose: `StudioDeviceProps`: props of `StudioDevice`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { CSSProperties, ReactNode } from "react";

import type { StudioView } from "./studio-view.type";

/** Props of {@link StudioDevice}. */
export interface StudioDeviceProps {
  /** The device and its orientation. */
  readonly view: Pick<StudioView, "device" | "isLandscape">;
  /** The scheme the screen is drawn in; the body follows it. */
  readonly scheme: "light" | "dark";
  /** The theme's custom properties, set on the screen only. */
  readonly sheetStyle: CSSProperties;
  /** The device's accessible name (the template and the scheme). */
  readonly label: string;
  /** The status bar's clock, from the catalogue. */
  readonly time: string;
  /** True while the screen is a picture (scaled down): its content takes no input, yet still scrolls. */
  readonly isInert: boolean;
  /** The template drawn on the screen. */
  readonly children: ReactNode;
}
