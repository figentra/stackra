/**
 * Stackra file contract:
 * Purpose: `MonoDisplay`, the landing kit's closing wordmark: the name in mono at the kit's `display` type step in the
 *          champagne core (the closing wordmark highlight), a tagline, and either three floors that rise bottom to
 *          top in the theme's floor steps once in view, or a code-glyph dither field behind it, its glyphs the size of
 *          the kit's `mono` type step so they read as code.
 * Boundary: a ruled band named by the wordmark, an `h2`. The wordmark is `dir="ltr"`, `lang="en"` (an Arabic page reads it in an English
 *           voice) and `translate="no"`. The floors
 *           and the field are decoration, hidden from assistive tech. The server draws every floor; only the browser at
 *           the `full` motion level rewinds them to rise, and a hidden floor keeps its place, so the layout never
 *           moves.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          motion principles (floor steps, no easing); WCAG 2.2 SC 2.2.2 and 2.3.3; STA-2041.
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { DitherArt, Heading, Text, useFloorSteps } from "@stackra/ui/react";
import { type ReactElement, useRef } from "react";

import type { MonoDisplayProps } from "#react/mono-display/mono-display.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

/** The floors under the wordmark. */
const FLOORS = 3;

/** A glyph cell as tall as the theme's `mono` type step, so the field reads as code; unset, DitherArt's own. */
const GLYPH_PX = Number.parseFloat(STACKRA_THEME.typography.mono?.size ?? "") || undefined;

/** The wordmark: the kit's `display` type step (size, leading and tracking), set in the mono family. */
const DISPLAY = {
  font: "var(--display)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "var(--display-letter-spacing)",
} as const;

/**
 * The wordmark, large, in mono.
 *
 * @example
 * <MonoDisplay title="stackra" tagline="One backend, every surface." />
 */
export function MonoDisplay({
  title,
  tagline,
  art = "floors",
  poster,
  className,
}: MonoDisplayProps): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  // The floors rise bottom to top on the theme's floor step once in view (@stackra/ui's one floor-step hook); a still
  // page, the server and the edge draw every floor.
  const risen = useFloorSteps(root, { total: FLOORS, isEnabled: art === "floors", threshold: 0.4 });

  return (
    <RuledBand label={title}>
      <div
        ref={root}
        data-slot="mono-display"
        className={`relative isolate flex flex-col items-start gap-6 overflow-hidden ${className ?? ""}`}
      >
        {art === "glyphs" && poster ? (
          <DitherArt
            mode="glyphs"
            poster={poster}
            mask="radial"
            {...(GLYPH_PX === undefined ? {} : { pixelSize: GLYPH_PX })}
            className="absolute inset-0 -z-10"
          />
        ) : null}
        <Heading level={2} type="h1" tone="core" style={DISPLAY}>
          <span dir="ltr" lang="en" translate="no">
            {title}
          </span>
        </Heading>
        {tagline ? <Text tone="muted">{tagline}</Text> : null}
        {art === "floors" ? (
          // Reversed, so the first floor in the DOM is the bottom one and rises first.
          <div aria-hidden="true" className="flex w-full max-w-md flex-col-reverse gap-1.5">
            {Array.from({ length: FLOORS }, (_, floor) => (
              <div
                key={floor}
                data-slot="mono-display-floor"
                className={`h-3 rounded-[var(--radius-sm)] border border-(--stk-tile-line) bg-(--stk-tile) ${floor < risen ? "" : "invisible"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </RuledBand>
  );
}
