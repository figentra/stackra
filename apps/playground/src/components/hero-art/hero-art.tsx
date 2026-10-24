/**
 * Stackra file contract:
 * Purpose: the decorative art beside the index page's hero: three stacked glass panes over a soft glow, showing what
 *          the system is made of (the colour roles, the Latin and Arabic faces, the radius and spacing steps), all
 *          read from the theme's CSS variables so it follows the scheme and any theme the studio applies.
 * Boundary: decoration only: `inert` and `aria-hidden`, so nothing in it is focused, read or measured as content.
 *          Hidden below the large breakpoint, where the hero stands alone.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.1.1 (decorative content).
 */

/** The roles the swatch pane shows, in reading order. */
const SWATCHES = ["accent", "success", "warning", "danger", "surface-tertiary", "border"] as const;

/** The radius steps the scale pane shows, smallest first. */
const RADII = ["var(--radius)", "calc(var(--radius) * 2)", "calc(var(--radius) * 4)", "9999px"];

const PANE = "glass absolute grid gap-3 rounded-3xl p-5";

/** The hero's decorative glass stack. */
export function HeroArt() {
  return (
    <div aria-hidden="true" inert className="relative hidden h-[24rem] select-none lg:block">
      <div className="hero-glow absolute -inset-4">
        <span />
        <span />
      </div>
      <div className={`${PANE} start-0 top-6 w-64 -rotate-6 rtl:rotate-6`}>
        <span className="font-mono text-xs text-muted">colors</span>
        <span className="grid grid-cols-3 gap-2">
          {SWATCHES.map((role) => (
            <span
              key={role}
              className="h-10 rounded-xl border border-border"
              style={{ background: `var(--${role})` }}
            />
          ))}
        </span>
      </div>
      <div className={`${PANE} end-0 top-20 w-72 rotate-3 rtl:-rotate-3`}>
        <span className="font-mono text-xs text-muted">type</span>
        <span className="flex items-baseline justify-between gap-4">
          <span className="text-6xl font-semibold tracking-tight">Aa</span>
          <span lang="ar" dir="rtl" className="font-[var(--font-arabic)] text-5xl font-semibold">
            أب
          </span>
        </span>
        <span className="text-xs text-muted">Geist · IBM Plex Sans Arabic</span>
      </div>
      <div className={`${PANE} start-16 bottom-2 w-72`}>
        <span className="font-mono text-xs text-muted">radius · space</span>
        <span className="flex items-end gap-3">
          {RADII.map((radius, step) => (
            <span
              key={radius}
              className="border border-foreground/40 bg-surface-secondary"
              style={{
                borderRadius: radius,
                width: `${2 + step * 0.75}rem`,
                height: `${2 + step * 0.75}rem`,
              }}
            />
          ))}
        </span>
        <span className="flex gap-1.5">
          <span className="h-2 w-6 rounded-full bg-accent" />
          <span className="h-2 w-10 rounded-full bg-default" />
          <span className="h-2 w-16 rounded-full bg-default" />
        </span>
      </div>
    </div>
  );
}
