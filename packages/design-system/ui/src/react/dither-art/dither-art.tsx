/**
 * Stackra file contract:
 * Purpose: the web `DitherArt`: a brand pattern (brand rules §40) drawn as an ordered Bayer 8×8 dither on a canvas at
 *          cell resolution, scaled up with crisp pixels, in three theme colours: the ground, the steel dots and the
 *          champagne core, either as square cells (`dots`) or as code characters in the mono font (`glyphs`); `sun`
 *          moves the core glow. At the `full` motion level it drifts slowly for under five seconds and then holds
 *          (WCAG 2.2.2; glyphs also reshuffle, each cell on its own beat), and stands still below it; the kit's poster
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

/**
 * How long the drift runs before it holds its last frame: under WCAG 2.2.2's five seconds, so auto-starting motion
 * beside other content needs no pause control. A legal threshold, not a design value.
 */
// oxlint-disable-next-line stackra/no-literal-duration -- reason: WCAG 2.2.2's five-second limit, not a design step
const DRIFT_MS = 4500;

/** The characters `glyphs` draws from by default. */
const GLYPHS = "{}[]()<>/=+*#;";

/** A 0..1 hash of a number. */
const fract = (n: number): number => {
  const s = Math.sin(n) * 43_758.5453;
  return s - Math.floor(s);
};

/** The glyph of cell (i, j) at time t: fixed per cell when still, each cell reshuffling every two seconds on its own beat. */
const glyphAt = (set: readonly string[], i: number, j: number, t: number): string => {
  const seed = fract(i * 12.9898 + j * 78.233);
  return set[Math.floor(fract(seed * 91.7 + Math.floor(t * 0.5 + seed) * 12.3) * set.length)] ?? "";
};

/** A brand pattern, dithered on a canvas over its poster. */
export function DitherArt({
  pattern = "strata",
  front = "accent",
  back = "background",
  core = "core",
  pixelSize = 4,
  mode = "dots",
  glyphs = GLYPHS,
  sun,
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
  const isGlyphs = mode === "glyphs";
  const sunX = sun?.x;
  const sunY = sun?.y;

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return undefined;
    const cell = Math.min(isGlyphs ? 24 : 8, Math.max(2, pixelSize));
    // Dots draw one canvas pixel per cell, scaled up crisp; glyphs need the cell's real size in device pixels.
    const scale = isGlyphs ? cell * (window.devicePixelRatio || 1) : 1;
    // A token name's colour, as the browser computes it on the canvas.
    const colourOf = (token: string) => {
      element.style.color = `var(--color-${token}, var(--${token}))`;
      return getComputedStyle(element).color;
    };
    const colours = [colourOf(back), colourOf(front), colourOf(core)];
    const set = [...(glyphs || GLYPHS)];
    const mono = getComputedStyle(element).getPropertyValue("--font-mono").trim() || "monospace";
    const centre = sunX === undefined || sunY === undefined ? undefined : { x: sunX, y: sunY };
    let cols = 0;
    let rows = 0;
    let isVisible = true;
    const draw = (t: number) => {
      if (cols === 0 || rows === 0) return;
      context.fillStyle = colours[0] ?? "";
      context.fillRect(0, 0, cols * scale, rows * scale);
      if (isGlyphs) {
        context.font = `${scale}px ${mono}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
      }
      for (const tone of [1, 2] as const) {
        context.fillStyle = colours[tone] ?? "";
        for (let j = 0; j < rows; j++)
          for (let i = 0; i < cols; i++) {
            if (ditherTone(pattern, i, j, cols, rows, t, centre) !== tone) continue;
            if (isGlyphs)
              context.fillText(glyphAt(set, i, j, t), (i + 0.5) * scale, (j + 0.5) * scale);
            else context.fillRect(i, j, 1, 1);
          }
      }
    };
    const start = performance.now();
    const now = () => (isStill ? 0 : ((performance.now() - start) / 1000) * speed);
    const resize = () => {
      cols = Math.max(1, Math.ceil(element.clientWidth / cell));
      rows = Math.max(1, Math.ceil(element.clientHeight / cell));
      element.width = cols * scale;
      element.height = rows * scale;
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
      // The drift settles on its last frame before WCAG 2.2.2's five seconds.
      if (time - start > DRIFT_MS) return;
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
  }, [pattern, front, back, core, pixelSize, isGlyphs, glyphs, sunX, sunY, speed, isStill, scheme]);

  return (
    <div
      aria-hidden="true"
      data-slot="dither-art"
      data-pattern={pattern}
      data-mode={mode}
      className={cn("pointer-events-none relative overflow-hidden", MASK[mask], className)}
    >
      <img
        src={typeof poster === "string" ? poster : poster[scheme === "light" ? "light" : "dark"]}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <canvas
        ref={canvas}
        className={cn(
          "absolute inset-0 size-full",
          !isGlyphs && "[image-rendering:pixelated]",
          isDrawn ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
