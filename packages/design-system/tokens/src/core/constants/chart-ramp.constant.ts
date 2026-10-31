/**
 * Stackra file contract:
 * Purpose: `CHART_RAMP`, the default chart palette's recipe: five OKLCH lightness steps around the theme's accent
 *          (chroma and hue kept), series 1 the darkest, and each scheme's lightness band, inside which a mark keeps 3:1
 *          against the surface (light 0.30 to 0.64, dark 0.55 to 0.95). A band narrower than the steps' reach scales
 *          the steps to fit it, spread evenly, so a near-black or near-white accent still gives five shades apart. The accent's lightness is clamped as the ramp's centre so all five steps
 *          fit the bounds (`clamp(low - first step, l, high - last step)`, the lower bound winning when they cross),
 *          which keeps the five steps apart instead of clamping two of them to the same colour.
 * Boundary: data only. The web writes each step as a relative colour of `var(--accent)` (`renderWebCss`), so every brand
 *           and the theme studio get a matching ramp live; native derives the same steps from the resolved accent.
 *           A theme overrides a step by naming `chart-ramp-<n>` in its palette.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 9: the chart set); chart style spec (2026-10-28) section 1; STA-1371.
 */

/** The ramp's steps and each scheme's lightness bounds (OKLCH, 0 to 1). */
export const CHART_RAMP = {
  steps: [-0.24, -0.12, 0, 0.12, 0.24],
  bounds: { light: [0.3, 0.64], dark: [0.55, 0.95] },
  /** The least lightness between neighbouring steps, so an accent near a bound still gives five apart (ADR 0501). */
  minimumStep: 0.06,
} as const;
