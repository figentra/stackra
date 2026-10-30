/**
 * Stackra file contract:
 * Purpose: the props of `PreviewFrame`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: STA-1371 (live preview frames, 2026-10-29).
 */
import type { BrandTheme } from "#src/constants/brand-themes";

/** Props of {@link PreviewFrame}. */
export interface PreviewFrameProps {
  /** The demo file's path in `DEMOS`. */
  readonly path: string;
  /** The frame's accessible name, so its landmark and its demo's are told apart from the page's (axe landmark-unique). */
  readonly label: string;
  /** The direction and language the demo is drawn in; its words follow `lang`'s catalogue. */
  readonly dir: "ltr" | "rtl";
  /** The language the demo's words are drawn in. */
  readonly lang: "en" | "ar";
  /** The brand layer the frame (and any overlay opened in it) is drawn in; the page's when omitted. */
  readonly brand?: BrandTheme | undefined;
  /** The frame's classes. */
  readonly className?: string | undefined;
  /** Drawn above the demo (a caption). */
  readonly caption?: React.ReactNode;
}
