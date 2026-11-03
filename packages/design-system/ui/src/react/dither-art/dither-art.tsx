/**
 * Stackra file contract:
 * Purpose: the web `DitherArt`: a brand pattern (brand rules §40) drawn as an ordered Bayer 8×8 dither on a canvas at
 *          cell resolution, scaled up with crisp pixels, in three theme colours: the ground, the steel dots and the
 *          champagne core. It drifts slowly at the `full` motion level and stands still below it; the kit's poster
 *          image sits under the canvas for the edge render, a page without script and print.
 * Boundary: decoration only, hidden from assistive tech. No WebGL and no dependency: the field code is the brand kit's,
 *           ported as it is. Colours are resolved from token names through the canvas's own computed style, so a theme
 *           or scheme switch redraws in the new colours. The drift redraws on the theme's tick (20 times a second) and only while the
 *           art is on screen.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); brand rules §39 and §40; motion principles (exact and quiet); WCAG 2.2 SC
 *          2.2.2 and 2.3.3; STA-2041.
 */
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { type ReactElement, use, useEffect, useRef, useState } from "react";

import { ditherTone } from "#core/functions/dither-tone.function";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useMotion } from "#react/design-system-provider/use-motion";
import type { DitherArtProps } from "#react/dither-art/dither-art.props";

/** The fades, as mask images. */
const MASK = {
  none: "",
  radial: "[mask-image:radial-gradient(closest-side,black_55%,transparent)]",
  bottom: "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]",
  top: "[mask-image:linear-gradient(to_top,black_55%,transparent)]",
} as const;

/** The time between drift frames, the theme's tick: the drift is slow, so 20 frames a second reads as smooth. */
const FRAME_MS = motionTiming(STACKRA_THEME, "tick").durationMs;

/** A brand pattern, dithered on a canvas over its poster. */
export function DitherArt({
  pattern = "strata",
  front = "accent",
  back = "background",
  core = "core",
  pixelSize = 4,
  speed = 1,
  poster,
  mask = "none",
  className,
}: DitherArtProps): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [isDrawn, setIsDrawn] = useState(false);
  const isStill = useMotion() !== "full" || speed <= 0;
  // Read so a scheme switch redraws in the new colours.
  const scheme = use(DesignSystemContext)?.resolvedColorScheme;

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return undefined;
    const cell = Math.min(8, Math.max(2, pixelSize));
    // A token name's colour, as the browser computes it on the canvas.
    const colourOf = (token: string) => {
      element.style.color = `var(--color-${token}, var(--${token}))`;
      return getComputedStyle(element).color;
    };
    const colours = [colourOf(back), colourOf(front), colourOf(core)];
    let cols = 0;
    let rows = 0;
    let isVisible = true;
    const draw = (t: number) => {
      if (cols === 0 || rows === 0) return;
      context.fillStyle = colours[0] ?? "";
      context.fillRect(0, 0, cols, rows);
      for (const tone of [1, 2] as const) {
        context.fillStyle = colours[tone] ?? "";
        for (let j = 0; j < rows; j++)
          for (let i = 0; i < cols; i++)
            if (ditherTone(pattern, i, j, cols, rows, t) === tone) context.fillRect(i, j, 1, 1);
      }
    };
    const start = performance.now();
    const now = () => (isStill ? 0 : ((performance.now() - start) / 1000) * speed);
    const resize = () => {
      cols = Math.max(1, Math.ceil(element.clientWidth / cell));
      rows = Math.max(1, Math.ceil(element.clientHeight / cell));
      element.width = cols;
      element.height = rows;
      draw(now());
    };
    resize();
    // oxlint-disable-next-line react/set-state-in-effect -- reason: the canvas shows only once the effect has drawn it, so the poster stays until then
    setIsDrawn(true);
    const sizes = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
    sizes?.observe(element);
    const sight =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            isVisible = entry?.isIntersecting ?? true;
          })
        : null;
    sight?.observe(element);
    let frame = 0;
    let last = 0;
    const tick = (time: number) => {
      if (isVisible && time - last >= FRAME_MS) {
        last = time;
        draw(now());
      }
      frame = requestAnimationFrame(tick);
    };
    if (!isStill) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      sizes?.disconnect();
      sight?.disconnect();
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- reason: the colours are read from the computed style, which a scheme switch changes
  }, [pattern, front, back, core, pixelSize, speed, isStill, scheme]);

  return (
    <div
      aria-hidden="true"
      data-slot="dither-art"
      data-pattern={pattern}
      className={cn("pointer-events-none relative overflow-hidden", MASK[mask], className)}
    >
      <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      <canvas
        ref={canvas}
        className={cn(
          "absolute inset-0 size-full [image-rendering:pixelated]",
          isDrawn ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
