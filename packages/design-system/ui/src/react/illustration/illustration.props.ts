/**
 * Stackra file contract:
 * Purpose: `IllustrationProps`, the props of the web `Illustration` in `illustration.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */

/** Props of the web Illustration. */
export interface IllustrationProps {
  /** The drawing's base URL, without the tone and extension, such as `art/engine` for `art/engine.ground.svg`. */
  readonly src: string;
  /** The drawing's viewBox width, for its aspect ratio and its smallest width. */
  readonly width: number;
  /** The drawing's viewBox height, for its aspect ratio. */
  readonly height: number;
  /** The drawing's spoken description; without it the drawing is decoration, hidden from assistive tech. */
  readonly alt?: string | undefined;
  /** Styles the drawing, such as its width. */
  readonly className?: string | undefined;
}
