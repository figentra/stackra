/**
 * Stackra file contract:
 * Purpose: the page of the foundations route: the stackra theme's colour roles (each with its contrast pair and
 *          ratio from the brand kit's contrast report), type scale, spacing, radii, shadows and motion. Every value
 *          comes from @stackra/tokens; the samples paint with the CSS variables the theme stylesheet defines, so the
 *          page shows what the renderer wrote.
 * Boundary: presentation only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 2 and 5); ADR 0060 (light, dark, RTL).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import contrastReport from "@stackra/tokens/assets/data/stackra/contrast.json";
import { ColorRole } from "@stackra/tokens/contracts";
import { useDesignSystem } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { FoundationsRoute } from "#src/routes/foundations/foundations.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::foundations.*` keys.
const STRINGS = {
  intro:
    "The stackra theme as the renderer wrote it: each sample is painted with the theme's CSS variables in the current colour scheme.",
  colors: "Colour roles",
  colorsNote:
    "Each role with the pair the brand kit's contrast report checks it in, and the ratio for this scheme.",
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

/** One row of the kit's contrast report. */
type ContrastPair = (typeof contrastReport)[number];

/** Roles that are a `-foreground` partner are shown with their base role, not on their own. */
const BASE_ROLES = ColorRole.filter((role) => !role.endsWith("-foreground"));

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
  const rows = contrastReport.filter((row) => row.theme === theme);
  const partner = READ_WITH[role] ?? `${role}-foreground`;
  return (
    rows.find((row) => row.background === role && row.foreground === partner) ??
    rows.find((row) => row.foreground === role && row.background === "background") ??
    rows.find((row) => row.foreground === role || row.background === role)
  );
}

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

/** A titled section of the page, labelled by its heading. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** The token foundations page. */
export function Foundations() {
  const { resolvedColorScheme } = useDesignSystem();
  const reportTheme = resolvedColorScheme === "dark" ? "dark" : "base";
  const hexOf = (role: ColorRole) =>
    resolvedColorScheme === "dark"
      ? STACKRA_THEME.colors[role].hexDark
      : STACKRA_THEME.colors[role].hexLight;

  return (
    <article className="grid gap-10">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold">{FoundationsRoute.title}</h1>
        <p className="max-w-prose">{STRINGS.intro}</p>
      </header>

      <Section id="colors" title={STRINGS.colors}>
        <p className="max-w-prose text-muted">{STRINGS.colorsNote}</p>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          {BASE_ROLES.map((role) => {
            const pair = pairOf(role, reportTheme);
            return (
              <li key={role} className="grid gap-2 rounded-lg border border-border p-3">
                <div
                  className="h-12 rounded border border-border"
                  style={{ background: cssVar(role) }}
                />
                <code className="font-mono text-sm">{role}</code>
                <span className="font-mono text-xs text-muted">{hexOf(role)}</span>
                {pair ? (
                  <div className="flex items-center gap-2 text-sm">
                    {pair.kind === "text" ? (
                      <span
                        lang="en"
                        className="rounded border border-border px-2 py-1 font-semibold"
                        style={{
                          background: cssVar(pair.background),
                          color: cssVar(pair.foreground),
                        }}
                      >
                        Aa
                      </span>
                    ) : null}
                    <span>
                      <code>{pair.foreground}</code> / <code>{pair.background}</code>: {pair.ratio}
                      :1 ({pair.level})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted">{STRINGS.noPair}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="typography" title={STRINGS.typography}>
        <ul className="grid gap-4">
          {Object.entries(STACKRA_THEME.typography).map(([name, style]) => (
            <li key={name} className="grid gap-1">
              <span className="font-mono text-xs text-muted">
                {name}: {style.weight} {style.size}/{style.lineHeight} {style.family}
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
      </Section>

      <Section id="spacing" title={STRINGS.spacing}>
        <ul className="grid gap-2">
          {Object.entries(STACKRA_THEME.spacing).map(([name, size]) => (
            <li key={name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-mono text-xs">
                space-{name} {size}
              </span>
              <span
                className="block h-3 rounded-sm bg-foreground"
                style={{ inlineSize: cssVar(`space-${name}`) }}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="radius" title={STRINGS.radius}>
        <ul className="flex flex-wrap gap-4">
          {RADII.map(([name, value]) => (
            <li key={name} className="grid justify-items-center gap-2">
              <span
                className="block size-16 border-2 border-foreground bg-surface"
                style={{ borderRadius: cssVar(name) }}
              />
              <span className="font-mono text-xs">
                {name} {value}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="shadows" title={STRINGS.shadows}>
        <ul className="flex flex-wrap gap-6">
          {Object.keys(STACKRA_THEME.shadows).map((name) => (
            <li key={name} className="grid justify-items-center gap-2">
              <span
                className="block size-20 rounded bg-surface"
                style={{ boxShadow: cssVar(`${name}-shadow`) }}
              />
              <span className="font-mono text-xs">{name}-shadow</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="motion" title={STRINGS.motion}>
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
                  {name}
                </th>
                <td className="pe-6">{step.duration}</td>
                <td>{step.easing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </article>
  );
}
