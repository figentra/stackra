/**
 * Stackra file contract:
 * Purpose: `ThemeLayout`, part of the token schema of the Stackra Design System (see `Theme`): the single knobs of
 *          size and structure every component reads (ADR 0501): the spacing unit (density), control and icon sizes,
 *          the touch target, the page frame and breakpoints, edges and the corner shape, the focus ring, the state
 *          layer, opacities, named component sizes, the stacking order and the colour role each structural region is
 *          painted with.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2); ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property
 *                     form).
 */
/** The size and structure knobs. */
export interface ThemeLayout {
  /**
   * Tailwind's spacing unit, `--spacing` (HeroUI's density knob): every `p-*`, `gap-*` and `h-*` utility is a multiple
   * of it, so one value makes a theme compact or comfortable.
   */
  readonly spacing: string;
  /** The control heights, `--control-height-<name>` (`sm`, `md`, `lg`): a field, a button and a segment of one size match. */
  readonly controlHeight: Readonly<Record<string, string>>;
  /** The icon sizes, `--icon-size-<name>` (`sm`, `md`, `lg`). */
  readonly iconSize: Readonly<Record<string, string>>;
  /** The least hit area of a control, `--touch-target` (24px on the web for WCAG 2.5.8; native uses 44). */
  readonly touchTarget: string;
  /** The page frame: `--page-padding`, `--gutter` and `--content-max-width`. */
  readonly page: {
    readonly padding: string;
    readonly gutter: string;
    readonly contentMaxWidth: string;
  };
  /** The breakpoints, `--breakpoint-<name>`: read at runtime by script and native; media queries take the build's. */
  readonly breakpoints: Readonly<Record<string, string>>;
  /** The hairline, HeroUI's `--border-width`. */
  readonly borderWidth: string;
  /** A form field's edge, HeroUI's `--field-border-width`; `0px` draws borderless fields lifted by the field shadow. */
  readonly fieldBorderWidth: string;
  /** The corner shape, `--corner-shape`: `round`, or `squircle` (CSS `corner-shape`, iOS `borderCurve: "continuous"`). */
  readonly cornerShape: "round" | "squircle";
  /**
   * The focus ring: `--focus-ring-width`, its gap from the element (HeroUI's `--ring-offset-width`) and its line
   * style, `--focus-ring-style`. Its colour is the `focus` role.
   */
  readonly focusRing: { readonly width: string; readonly offset: string; readonly style: string };
  /**
   * The state layer, `--state-<name>` (`hover`, `press`, `focus`, `selected`, `drag`): the share of the foreground a
   * fill mixes in for that state, a number from 0 to 1.
   */
  readonly state: Readonly<Record<string, string>>;
  /** Opacities from 0 to 1: `disabled` is HeroUI's `--disabled-opacity`, the others `--opacity-<name>`. */
  readonly opacity: Readonly<Record<string, string>>;
  /** Named component sizes, `--size-<name>` (a table header row, an app header, a step indicator). */
  readonly sizes: Readonly<Record<string, string>>;
  /** The stacking order, `--z-<name>`, unitless integers. */
  readonly zIndex: Readonly<Record<string, string>>;
  /** Whether soft foregrounds take a more saturated mix of their colour (`--<status>-soft-foreground`). */
  readonly vibrant: boolean;
  /** The pointer over an interactive control, HeroUI's `--cursor-interactive` (`pointer` or `default`). */
  readonly cursor: "pointer" | "default";
  /** How a skeleton loads, HeroUI's `--skeleton-animation` (`shimmer`, `pulse` or `none`). */
  readonly skeleton: "shimmer" | "pulse" | "none";
  /** The global animations switch: `false` ends every transition and animation at once, as `data-motion="none"`. */
  readonly animations: boolean;
  /**
   * The colour role each structural region is painted with, `--<name>: var(--<role>)` (the sidebar on the surface or
   * the page background, the tray of a list or widget, the surface levels, the scrim); a role is a kebab-case
   * property name.
   */
  readonly regions: Readonly<Record<string, string>>;
}
