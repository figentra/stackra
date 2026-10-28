/**
 * Stackra file contract:
 * Purpose: the page of the foundations route: the stackra theme's colour roles in groups (each with its hex and the
 *          contrast pair the brand kit's report checks it in, the ratio computed from the theme's colours), type
 *          scale, spacing, radii, shadows and motion. Every value comes from @stackra/tokens; the samples paint with
 *          the CSS variables the theme stylesheet defines, so the page shows what the renderer wrote.
 * Boundary: presentation only. Token names, hex values and ratios are isolated left to right (`<bdi>`) so a
 *          right-to-left page keeps them readable.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 2 and 5); ADR 0060 (light, dark, RTL).
 */
import { contrastRatio, STACKRA_THEME } from "@stackra/tokens";
import contrastReport from "@stackra/tokens/assets/data/stackra/contrast.json";
import type { ColorRole, ColorToken } from "@stackra/tokens/contracts";
import { Heading, useDesignSystem } from "@stackra/ui/react";

import { PageSection } from "#src/components/page-section";
import { FoundationsRoute } from "#src/routes/foundations/foundations.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::foundations.*` keys.
const STRINGS = {
  specimen: "Aa",
  contrast: (ratio: string, level: string) => `${ratio}:1 (${level})`,
  documentTitle: `${FoundationsRoute.title} · Stackra Playground`,
  intro:
    "The stackra theme as the renderer wrote it: each sample is painted with the theme's CSS variables in the current colour scheme.",
  colors: "Colour roles",
  colorsNote:
    "Each role with its hex and the pair the brand kit's contrast report checks it in, with the ratio for this scheme.",
  groups: {
    surfaces: "Surfaces",
    content: "Content",
    status: "Status",
    fields: "Fields",
    controls: "Controls",
    utility: "Utility",
  },
  noPair: "No pair in the contrast report",
  typography: "Typography",
  latinSample: "Build once, theme anywhere.",
  arabicSample: "ابنِ مرة واحدة وطبّق أي سمة.",
  spacing: "Spacing",
  radius: "Radius",
  shadows: "Shadows",
  motion: "Motion",
  name: "Name",
  duration: "Duration",
  easing: "Easing",
} as const;

/** The colour roles by group, each shown once; a `-foreground` partner appears in its base role's pair. */
const ROLE_GROUPS = {
  surfaces: ["background", "surface", "surface-secondary", "surface-tertiary", "overlay"],
  content: ["foreground", "muted", "link"],
  status: ["success", "warning", "danger"],
  fields: ["field-background", "field-placeholder", "field-border"],
  controls: ["default", "accent", "segment", "focus"],
  utility: ["border", "separator", "backdrop"],
} as const satisfies Record<keyof typeof STRINGS.groups, readonly ColorRole[]>;

/** One pairing the page checks: the kit's report rows, which name the mode `base` or `dark`. */
interface ContrastPair {
  readonly foreground: string;
  readonly background: string;
  readonly theme: string;
  readonly kind: string;
  readonly minimum: number | null;
}

// The kit predates HeroUI's segment role, so its report has no segment pair; it is checked as text, as the others.
const PAIRS: readonly ContrastPair[] = [
  ...contrastReport,
  ...["base", "dark"].map((theme) => ({
    foreground: "segment-foreground",
    background: "segment",
    theme,
    kind: "text",
    minimum: 4.5,
  })),
];

/** The text a role is read with: `<role>-foreground`, or the two roles named otherwise. */
const READ_WITH: Readonly<Record<string, string>> = {
  background: "foreground",
  "field-background": "field-foreground",
};

/**
 * The contrast pair a role is checked in for a scheme: its own foreground on it, else the role as text on the
 * background, else any pair it is part of.
 */
function pairOf(role: string, theme: "base" | "dark"): ContrastPair | undefined {
  const rows = PAIRS.filter((row) => row.theme === theme);
  const partner = READ_WITH[role] ?? `${role}-foreground`;
  return (
    rows.find((row) => row.background === role && row.foreground === partner) ??
    rows.find((row) => row.foreground === role && row.background === "background") ??
    rows.find((row) => row.foreground === role || row.background === role)
  );
}

const TOKENS: Readonly<Record<string, ColorToken>> = {
  ...STACKRA_THEME.colors,
  ...STACKRA_THEME.palette,
};

/** The WCAG level a ratio reaches, as the kit's report grades it; a pair with no minimum is decorative. */
const levelOf = (ratio: number, minimum: number | null) =>
  minimum === null
    ? "decorative"
    : ratio >= 7
      ? "AAA"
      : ratio >= 4.5
        ? "AA"
        : ratio >= 3
          ? "AA-large"
          : "fail";

/** Every radius the theme renders: the CSS variable name and its value. */
const RADII: readonly (readonly [string, string])[] = [
  ["radius", STACKRA_THEME.radius.base],
  ["field-radius", STACKRA_THEME.radius.field],
  ...Object.entries(STACKRA_THEME.radius.steps).map(
    ([name, value]) => [`radius-${name}`, value] as const,
  ),
];

/** A CSS custom property reference. */
const cssVar = (name: string) => `var(--${name})`;

/** The token foundations page. */
export function Foundations() {
  const { resolvedColorScheme } = useDesignSystem();
  const dark = resolvedColorScheme === "dark";
  const hexOf = (name: string) => (dark ? TOKENS[name]?.hexDark : TOKENS[name]?.hexLight) ?? "";

  const roleCard = (role: ColorRole) => {
    const pair = pairOf(role, dark ? "dark" : "base");
    const ratio = pair ? contrastRatio(hexOf(pair.foreground), hexOf(pair.background)) : 0;
    return (
      <li key={role} className="grid gap-2 rounded-lg border border-border p-3">
        <div className="h-12 rounded border border-border" style={{ background: cssVar(role) }} />
        <code className="font-mono text-sm">
          <bdi dir="ltr">{role}</bdi>
        </code>
        <span className="font-mono text-xs text-muted">
          <bdi dir="ltr">{hexOf(role)}</bdi>
        </span>
        {pair ? (
          <div className="flex items-center gap-2 text-sm">
            {pair.kind === "text" ? (
              <span
                aria-hidden="true"
                className="rounded border border-border px-2 py-1 font-semibold"
                style={{ background: cssVar(pair.background), color: cssVar(pair.foreground) }}
              >
                {STRINGS.specimen}
              </span>
            ) : null}
            <span>
              <bdi dir="ltr">
                <code>{pair.foreground}</code> / <code>{pair.background}</code>:{" "}
                {STRINGS.contrast(ratio.toFixed(2), levelOf(ratio, pair.minimum))}
              </bdi>
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted">{STRINGS.noPair}</span>
        )}
      </li>
    );
  };

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{FoundationsRoute.title}</Heading>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>

      <PageSection id="colors" title={STRINGS.colors}>
        <p className="max-w-prose text-muted">
          <bdi>{STRINGS.colorsNote}</bdi>
        </p>
        {(Object.keys(ROLE_GROUPS) as (keyof typeof ROLE_GROUPS)[]).map((group) => (
          <div key={group} className="grid gap-3">
            <Heading level={3}>{STRINGS.groups[group]}</Heading>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
              {ROLE_GROUPS[group].map(roleCard)}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="typography" title={STRINGS.typography}>
        <ul className="grid gap-4">
          {Object.entries(STACKRA_THEME.typography).map(([name, style]) => (
            <li key={name} className="grid gap-1">
              <span className="font-mono text-xs text-muted">
                <bdi dir="ltr">
                  {name}: {style.weight} {style.size}/{style.lineHeight} {style.family}
                </bdi>
              </span>
              <p
                lang={style.family === "arabic" ? "ar" : "en"}
                dir={style.family === "arabic" ? "rtl" : "ltr"}
                className="break-words"
                style={{ font: cssVar(name), letterSpacing: cssVar(`${name}-letter-spacing`) }}
              >
                {style.family === "arabic" ? STRINGS.arabicSample : STRINGS.latinSample}
              </p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="spacing" title={STRINGS.spacing}>
        <ul className="grid gap-2">
          {Object.entries(STACKRA_THEME.spacing).map(([name, size]) => (
            <li key={name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-mono text-xs">
                <bdi dir="ltr">{`space-${name} ${size}`}</bdi>
              </span>
              <span
                className="block h-3 rounded-sm bg-foreground"
                style={{ inlineSize: cssVar(`space-${name}`) }}
              />
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="radius" title={STRINGS.radius}>
        <ul className="flex flex-wrap gap-4">
          {RADII.map(([name, value]) => (
            <li key={name} className="grid justify-items-center gap-2">
              <span
                className="block size-16 border-2 border-foreground bg-surface"
                style={{ borderRadius: cssVar(name) }}
              />
              <span className="font-mono text-xs">
                <bdi dir="ltr">
                  {name} {value}
                </bdi>
              </span>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="shadows" title={STRINGS.shadows}>
        <ul className="flex flex-wrap gap-6">
          {Object.keys(STACKRA_THEME.shadows).map((name) => (
            <li key={name} className="grid justify-items-center gap-2">
              <span
                className="block size-20 rounded bg-surface"
                style={{ boxShadow: cssVar(`${name}-shadow`) }}
              />
              <span className="font-mono text-xs">
                <bdi dir="ltr">{`${name}-shadow`}</bdi>
              </span>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="motion" title={STRINGS.motion}>
        <table className="w-fit text-start text-sm">
          <thead>
            <tr>
              <th scope="col" className="pe-6 text-start">
                {STRINGS.name}
              </th>
              <th scope="col" className="pe-6 text-start">
                {STRINGS.duration}
              </th>
              <th scope="col" className="text-start">
                {STRINGS.easing}
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {Object.entries(STACKRA_THEME.motion).map(([name, step]) => (
              <tr key={name}>
                <th scope="row" className="pe-6 text-start font-normal">
                  <bdi dir="ltr">{name}</bdi>
                </th>
                <td className="pe-6">
                  <bdi dir="ltr">{step.duration}</bdi>
                </td>
                <td>
                  <bdi dir="ltr">{step.easing}</bdi>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>
    </article>
  );
}
