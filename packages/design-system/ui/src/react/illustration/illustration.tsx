/**
 * Stackra file contract:
 * Purpose: the web `Illustration`: a landing drawing coloured by the page's token roles. The drawing ships as four
 *          single-tone mask layers, `<src>.<tone>.svg` for ground, dots, line and core, each the whole drawing in
 *          painter's order with its own tone white and the rest black; each layer masks (by luminance) a box filled
 *          with its role: ground the background, dots the tile line, line the accent, core the core. So the drawing
 *          follows the theme and the scheme without fetching or inlining its SVG.
 * Boundary: an image named by `alt`, or decoration hidden from assistive tech without it. Its aspect ratio is the
 *           viewBox's, and it never draws narrower than half its viewBox width in CSS px, so a 4-unit dither cell is
 *           never under 2 px (BRAND). It never mirrors in right-to-left. Nothing moves.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (illustrations never mirror); ADR 0501 (the colour roles);
 *          STA-2041 (the art decision: four mask layers).
 */
import { cn } from "@heroui/react";
import type { CSSProperties, ReactElement } from "react";

import type { IllustrationProps } from "#react/illustration/illustration.props";

/** Each tone's layer, in painter's order, with the role that fills it (written out whole, so Tailwind sees it). */
const TONES = [
  ["ground", "[background-color:var(--background)]"],
  ["dots", "[background-color:var(--stk-tile-line)]"],
  ["line", "[background-color:var(--accent)]"],
  ["core", "[background-color:var(--core)]"],
] as const;

/** A layer: its mask is the tone's file, stretched over the drawing's box. */
const LAYER =
  "absolute inset-0 [mask-image:var(--illustration-mask)] [mask-mode:luminance] [mask-repeat:no-repeat] [mask-size:100%_100%]";

/** A landing drawing in four token-coloured mask layers. */
export function Illustration({
  src,
  width,
  height,
  alt,
  className,
}: IllustrationProps): ReactElement {
  return (
    <div
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      data-slot="illustration"
      // Data from the props, not design: the viewBox's ratio, and half its width so a dither cell stays 2 px or more.
      style={{ aspectRatio: `${width} / ${height}`, minWidth: `${Math.ceil(width / 2)}px` }}
      className={cn("relative isolate", className)}
    >
      {TONES.map(([tone, fill]) => (
        <span
          key={tone}
          data-slot="illustration-layer"
          data-tone={tone}
          style={
            {
              "--illustration-mask": `url(${JSON.stringify(`${src}.${tone}.svg`)})`,
            } as CSSProperties
          }
          className={cn(LAYER, fill)}
        />
      ))}
    </div>
  );
}
