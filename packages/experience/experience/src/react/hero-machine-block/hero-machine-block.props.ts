/**
 * Stackra file contract:
 * Purpose: `HeroMachineBlockProps`, what a page hands the HeroMachineBlock: the headline, its lede and actions, the
 *          engine drawing, the dither horizon and the machine (the schematic) at the inline end.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content; the drawing
 *           is a URL to an SVG the page ships, never markup.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */
import type { DitherArtProps } from "@stackra/ui/react";
import type { ReactNode } from "react";

/**
 * The landing's hero: the machine on its horizon.
 *
 * @example
 * <HeroMachineBlock title="One backend, every surface." lede="…" primary={docs} art={{ src: engine }}
 *   horizon={{ poster: strata, sun: { x: 0.8, y: 1 } }} machine={<Schematic … />} />
 */
export interface HeroMachineBlockProps {
  /** The page's one `h1`, and the section's spoken name. */
  readonly title: string;
  /** The line under the title. */
  readonly lede: string;
  /** The one primary action, drawn as the champagne pill. */
  readonly primary: { readonly label: string; readonly href: string };
  /** A button that copies `value` (the llms.txt URL). */
  readonly copyLink?: { readonly label: string; readonly value: string } | undefined;
  /** A shell command drawn as a mono chip with a copy button. */
  readonly command?: string | undefined;
  /** The engine drawing: an SVG URL, decorative unless `alt` is given. Never mirrored in right-to-left. */
  readonly art: { readonly src: string; readonly alt?: string | undefined };
  /** The dither horizon under the drawing; `front` defaults to `stk-tile-line` and `mask` to `top`. */
  readonly horizon: DitherArtProps;
  /** The machine at the inline end: a `Schematic` of the action window piped into the surfaces. */
  readonly machine?: ReactNode;
  /** Styles the section. */
  readonly className?: string | undefined;
}
