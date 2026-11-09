/**
 * Stackra file contract:
 * Purpose: `ColorSwatchProps`, the props of the web `ColorSwatch` in `color-swatch.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          v3 on web); owner decision 6 of STA-350 (thin wrappers); STA-1981.
 */
import type { ColorSwatchRootProps } from "@heroui/react";

/** Props of the web ColorSwatch: its own props plus HeroUI v3's colour swatch props, passed through unchanged. */
export type ColorSwatchProps = Omit<ColorSwatchRootProps, "color" | "colorName" | "size"> & {
  /** The colour shown: any CSS colour, for example `#0485f7`, `rgb(4 133 247)` or `var(--accent)`. */
  readonly color: string;
  /** The colour's accessible name, for example "Ocean blue"; without it a parsable colour is described by React Aria in the user's language. */
  readonly label?: string | undefined;
  /** The size. Defaults to `md`. */
  readonly size?: "sm" | "md" | "lg" | undefined;
};
