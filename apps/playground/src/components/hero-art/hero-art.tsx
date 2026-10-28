/**
 * Stackra file contract:
 * Purpose: the index page's hero stage: the beam-S wordmark at full width in its artwork colour, echoed above and
 *          below as hairline outlines, on the brand's grid, with glass tiles of the system's parts (the st tile, a
 *          switch, the faces, swatches, an avatar group, brand icons) floating across it on the brand's graph lines.
 *          The tiles settle in once on load; nothing moves after, and nothing moves under reduced motion.
 * Boundary: decoration only: `inert` and `aria-hidden`, so nothing in it is focused, read or measured as content.
 *          The page names itself in its h1, outside the stage. Every colour is a theme variable.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0320 (glass and the showcase stage); WCAG 2.2 SC 1.1.1, 2.3.3.
 */
import type { CSSProperties, ReactNode } from "react";

import { BrandGlyph, type BrandGlyphName } from "#src/components/brand-glyph";
import { StackraWordmark } from "#src/components/stackra-wordmark";

/** A tile's place on the stage (percent of its box, from the inline start), its tilt and its size. */
interface Tile {
  readonly start: number;
  readonly top: number;
  readonly tilt: number;
  readonly size: "sm" | "md" | "lg";
  /** Shown from the small breakpoint up only, so a phone keeps the wordmark readable. */
  readonly isWide?: boolean;
  readonly face: ReactNode;
}

/** Glyph specimens and the brand mark: drawn shapes, not translatable text. */
const GLYPHS = { mark: "st", latin: "Aa", arabic: "أب" } as const;

const SIZE = {
  sm: "size-[clamp(2rem,5vw,3.75rem)]",
  md: "size-[clamp(2.5rem,7vw,5.25rem)]",
  lg: "size-[clamp(3rem,8.5vw,6.5rem)]",
} as const;

/** The st tile, as the brand draws it small: the two letters in the artwork colour. */
const ST_TILE = (
  <span className="font-mono text-[clamp(1.25rem,3vw,2.25rem)] font-medium tracking-[-0.04em] text-[var(--stk-ink)]">
    {GLYPHS.mark}
  </span>
);

const SWITCH = (
  <span className="flex h-[38%] w-[62%] items-center justify-end rounded-full bg-accent p-[6%]">
    <span className="aspect-square h-full rounded-full bg-accent-foreground" />
  </span>
);

const FACES = (
  <span className="flex items-baseline gap-1 font-semibold">
    <span className="text-[clamp(1.1rem,2.6vw,2rem)]">{GLYPHS.latin}</span>
    <span
      lang="ar"
      dir="rtl"
      className="font-[family-name:var(--font-arabic)] text-[clamp(1rem,2.3vw,1.75rem)]"
    >
      {GLYPHS.arabic}
    </span>
  </span>
);

const SWATCHES = (
  <span className="grid w-[56%] grid-cols-2 gap-[8%]">
    {["accent", "success", "warning", "danger"].map((role) => (
      <span
        key={role}
        className="aspect-square rounded-[30%]"
        style={{ background: `var(--${role})` }}
      />
    ))}
  </span>
);

const AVATARS = (
  <span className="flex -space-x-1.5 rtl:space-x-reverse">
    {["LH", "OS", "SK"].map((initials) => (
      <span
        key={initials}
        className="grid size-[clamp(0.875rem,2.4vw,1.75rem)] place-items-center rounded-full border-2 border-surface bg-default text-[clamp(0.5rem,0.9vw,0.625rem)] font-semibold"
      >
        {initials}
      </span>
    ))}
  </span>
);

const CHECK = (
  <span className="grid size-[44%] place-items-center rounded-[22%] bg-accent text-accent-foreground">
    <BrandGlyph name="check" className="size-[70%]" />
  </span>
);

const glyph = (name: BrandGlyphName) => (
  <BrandGlyph name={name} className="size-[42%] text-foreground" />
);

/** The tiles, in the order they settle. */
const TILES: readonly Tile[] = [
  { start: 6, top: 16, tilt: -10, size: "md", face: glyph("module"), isWide: true },
  { start: 22, top: 50, tilt: 12, size: "lg", face: ST_TILE },
  { start: 41, top: 6, tilt: -6, size: "md", face: SWITCH },
  { start: 47, top: 58, tilt: 8, size: "lg", face: FACES },
  { start: 64, top: 22, tilt: -12, size: "sm", face: CHECK },
  { start: 74, top: 2, tilt: 6, size: "md", face: SWATCHES, isWide: true },
  { start: 80, top: 60, tilt: -8, size: "md", face: AVATARS },
  { start: 92, top: 30, tilt: 10, size: "sm", face: glyph("pipeline"), isWide: true },
];

/** The graph lines between the tiles: dashed hairlines with square nodes, as the brand's graph pattern draws them. */
const LINES = [
  "M 30 60 C 180 10, 300 340, 470 120",
  "M 470 120 C 560 40, 640 200, 700 190",
  "M 280 400 C 420 520, 520 380, 520 420",
  "M 700 190 C 820 160, 860 440, 960 300",
] as const;

const NODES: readonly (readonly [number, number])[] = [
  [30, 60],
  [470, 120],
  [700, 190],
  [280, 400],
  [960, 300],
];

/** The hero's decorative stage. */
export function HeroArt() {
  return (
    <div
      aria-hidden="true"
      inert
      className="hero-stage relative isolate mx-auto w-full max-w-5xl py-[3%] select-none"
    >
      <div className="hero-grid absolute -inset-x-6 -inset-y-4" />
      <div className="hero-glow absolute inset-[10%]">
        <span />
        <span />
      </div>
      <div className="relative grid">
        <StackraWordmark variant="outline" className="w-full text-foreground/25" />
        <StackraWordmark className="-mt-[7%] w-full text-[var(--stk-ink)]" />
        <StackraWordmark variant="outline" className="-mt-[7%] w-full text-foreground/25" />
      </div>
      <svg
        viewBox="0 0 1000 520"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full text-foreground/35 rtl:-scale-x-100"
        fill="none"
        stroke="currentColor"
      >
        {LINES.map((d) => (
          <path
            key={d}
            d={d}
            strokeWidth={1}
            strokeDasharray="3 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {NODES.map(([x, y]) => (
        <span
          key={`${x}-${y}`}
          className="absolute size-1.5 -translate-y-1/2 bg-foreground/50 ltr:-translate-x-1/2 rtl:translate-x-1/2"
          style={{ insetInlineStart: `${x / 10}%`, top: `${(y / 520) * 100}%` }}
        />
      ))}
      {TILES.map(({ start, top, tilt, size, face, isWide }, index) => (
        <span
          key={`${start}-${top}`}
          className={`hero-tile material-thin absolute grid place-items-center rounded-[22%] ${SIZE[size]} ${isWide ? "max-sm:hidden" : ""}`}
          style={
            {
              insetInlineStart: `${start}%`,
              top: `${top}%`,
              rotate: `${tilt}deg`,
              "--tile-delay": `${120 + index * 70}ms`,
            } as CSSProperties
          }
        >
          {face}
        </span>
      ))}
    </div>
  );
}
