/**
 * Stackra file contract:
 * Purpose: `MonoDisplay`, the landing kit's closing wordmark: the name in large mono in the champagne core (the
 *          closing wordmark highlight), a tagline, and either three floors that rise bottom to top in the theme's
 *          floor steps once in view, or a code-glyph dither field behind it.
 * Boundary: a section named by the wordmark, an `h2`. The wordmark is `dir="ltr"` and `translate="no"`. The floors and
 *           the field are decoration, hidden from assistive tech. The server draws every floor; only the browser at the
 *           `full` motion level rewinds them to rise, and a hidden floor keeps its place, so the layout never moves.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          motion principles (floor steps, no easing); WCAG 2.2 SC 2.2.2 and 2.3.3; STA-2041.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { DitherArt, Heading, Text, useMotion } from "@stackra/ui/react";
import { type ReactElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import type { MonoDisplayProps } from "#react/mono-display/mono-display.props";

/** The floors under the wordmark. */
const FLOORS = 3;

/** The time between floors: the theme's `floor` motion step. */
const STEP_MS = motionTiming(STACKRA_THEME, "floor").durationMs;

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
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const motion = useMotion();
  const plays = art === "floors" && motion === "full";
  // Every floor first, as the server and the edge draw them.
  const [risen, setRisen] = useState(FLOORS);
  const [isStarted, setIsStarted] = useState(false);

  // Before paint, so floors about to rise never flash; dropping below `full` mid-rise draws them all.
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: the server draws every floor; only the browser rewinds them to rise
    setRisen(plays ? 0 : FLOORS);
  }, [plays]);

  useEffect(() => {
    const element = root.current;
    if (!plays || isStarted || !element) return undefined;
    if (typeof IntersectionObserver !== "function") {
      // oxlint-disable-next-line react/set-state-in-effect -- reason: with no IntersectionObserver there is no view to wait for
      setIsStarted(true);
      return undefined;
    }
    const sight = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsStarted(true);
      },
      { threshold: 0.4 },
    );
    sight.observe(element);
    return () => sight.disconnect();
  }, [plays, isStarted]);

  useEffect(() => {
    if (!plays || !isStarted || risen >= FLOORS) return undefined;
    const step = setTimeout(() => setRisen((count) => count + 1), STEP_MS);
    return () => clearTimeout(step);
  }, [plays, isStarted, risen]);

  return (
    <section
      ref={root}
      aria-labelledby={id}
      data-slot="mono-display"
      className={`relative isolate flex flex-col items-start gap-6 overflow-hidden py-16 ${className ?? ""}`}
    >
      {art === "glyphs" && poster ? (
        <DitherArt mode="glyphs" poster={poster} mask="radial" className="absolute inset-0 -z-10" />
      ) : null}
      <Heading
        level={2}
        type="h1"
        tone="core"
        id={id}
        className="font-mono text-[clamp(3rem,14vw,10rem)] leading-none tracking-tight"
      >
        <span dir="ltr" translate="no">
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
    </section>
  );
}
