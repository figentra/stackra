/**
 * Stackra file contract:
 * Purpose: the Theme Studio's live preview: the derived theme's custom properties (HeroUI's and Stackra's, for the
 *          scheme on screen) set inline on a sheet of its own background, holding real @stackra/ui components and the
 *          index page's scenes, so every change is seen at once. Under it, the contrast of the theme's main
 *          foreground and background pairs, each against WCAG 2.2 AA (4.5:1 for text, 3:1 for edges and focus).
 * Boundary: presentation only; the theme comes from the page. The canvas has its own width (fluid, tablet, phone)
 *          and scheme (the page's until one is picked), as a builder's canvas has.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); WCAG 2.2 SC 1.4.3, 1.4.11.
 */
import { contrastRatio, themeVariables } from "@stackra/tokens";
import type { ColorRole, Theme } from "@stackra/tokens/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type CSSProperties } from "react";

import { Choice } from "#src/components/choice";
import { Showcase } from "#src/components/showcase";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::studio.preview.*` keys.
const STRINGS = {
  title: "Preview",
  canvas: "Canvas",
  width: "Canvas width",
  widths: { fluid: "Fluid", tablet: "Tablet, 768 px", phone: "Phone, 390 px" },
  scheme: "Preview scheme",
  schemes: { light: "Light preview", dark: "Dark preview" },
  contrast: "Contrast",
  contrastNote: "Text needs 4.5:1, edges and focus 3:1 (WCAG 2.2 AA).",
  passes: "Passes AA",
  fails: "Below AA",
  buttons: ["Primary", "Secondary", "Tertiary", "Outline", "Ghost", "Danger"],
  field: "Project name",
  fieldValue: "Atlas",
  notify: "Email me about releases",
  remember: "Remember this device",
  statuses: [
    ["success", "Live"],
    ["warning", "Building"],
    ["danger", "Failed"],
    ["accent", "Draft"],
  ],
} as const;

/** The pairs the report measures: a name, the foreground and background roles, and the ratio they need. */
const PAIRS: readonly { name: string; fg: ColorRole; bg: ColorRole; needs: number }[] = [
  { name: "Text on background", fg: "foreground", bg: "background", needs: 4.5 },
  { name: "Muted text on background", fg: "muted", bg: "background", needs: 4.5 },
  { name: "Text on surface", fg: "surface-foreground", bg: "surface", needs: 4.5 },
  { name: "Accent label", fg: "accent-foreground", bg: "accent", needs: 4.5 },
  { name: "Link on background", fg: "link", bg: "background", needs: 4.5 },
  { name: "Field text", fg: "field-foreground", bg: "field-background", needs: 4.5 },
  { name: "Danger label", fg: "danger-foreground", bg: "danger", needs: 4.5 },
  { name: "Field edge", fg: "field-border", bg: "field-background", needs: 3 },
  { name: "Focus ring", fg: "focus", bg: "background", needs: 3 },
];

const VARIANTS = ["primary", "secondary", "tertiary", "outline", "ghost", "danger"] as const;

/** The canvas widths: an icon and the most the sheet may span. */
const WIDTHS = {
  fluid: { icon: "monitor", max: "max-w-none" },
  tablet: { icon: "tablet", max: "max-w-[768px]" },
  phone: { icon: "smartphone", max: "max-w-[390px]" },
} as const;

type CanvasWidth = keyof typeof WIDTHS;

/** Props of {@link StudioPreview}. */
export interface StudioPreviewProps {
  /** The theme to show. */
  theme: Theme;
  /** The colour scheme on screen. */
  scheme: "light" | "dark";
}

/** The live preview and its contrast report. */
export function StudioPreview({ theme, scheme: pageScheme }: StudioPreviewProps) {
  const [width, setWidth] = useState<CanvasWidth>("fluid");
  const [schemeChoice, setSchemeChoice] = useState<"light" | "dark" | null>(null);
  const scheme = schemeChoice ?? pageScheme;
  const { heroui, stackra } = themeVariables(theme);
  const style = {
    ...heroui.root,
    ...stackra.root,
    ...heroui[scheme],
    ...stackra[scheme],
  } as CSSProperties;
  const hex = scheme === "dark" ? "hexDark" : "hexLight";

  return (
    <section aria-labelledby="studio-preview" className="grid min-w-0 content-start gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Ui.Heading id="studio-preview" level={2} className="[font:var(--h4)]">
          {STRINGS.title}
        </Ui.Heading>
        <Ui.Toolbar aria-label={STRINGS.canvas} className="flex flex-wrap items-center gap-2">
          <Ui.ToggleButtonGroup
            aria-label={STRINGS.width}
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[width]}
            onSelectionChange={(keys) => {
              const picked = (Object.keys(WIDTHS) as CanvasWidth[]).find((key) => keys.has(key));
              if (picked) setWidth(picked);
            }}
          >
            {(Object.keys(WIDTHS) as CanvasWidth[]).map((key) => (
              <Choice key={key} id={key} aria-label={STRINGS.widths[key]}>
                <Ui.Icon name={WIDTHS[key].icon} size="sm" />
              </Choice>
            ))}
          </Ui.ToggleButtonGroup>
          <Ui.ToggleButtonGroup
            aria-label={STRINGS.scheme}
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[scheme]}
            onSelectionChange={(keys) =>
              setSchemeChoice(keys.has("dark") ? "dark" : keys.has("light") ? "light" : null)
            }
          >
            <Choice id="light" aria-label={STRINGS.schemes.light}>
              <Ui.Icon name="sun" size="sm" />
            </Choice>
            <Choice id="dark" aria-label={STRINGS.schemes.dark}>
              <Ui.Icon name="moon" size="sm" />
            </Choice>
          </Ui.ToggleButtonGroup>
        </Ui.Toolbar>
      </div>
      {/* The canvas: a ground the sheet sits on, at the width picked, in the scheme picked. */}
      <div className="rounded-3xl border border-separator bg-surface-secondary p-3 sm:p-5">
        <div
          style={style}
          data-theme={scheme}
          className={`mx-auto grid w-full ${WIDTHS[width].max} gap-6 rounded-3xl border border-separator bg-background p-5 text-foreground transition-[max-width] duration-300 motion-reduce:transition-none [font-family:var(--font-sans)] sm:p-6 rtl:[font-family:var(--font-arabic)] ${scheme === "dark" ? "dark" : ""}`}
        >
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant, index) => (
              <Ui.Button key={variant} variant={variant} size="sm">
                {STRINGS.buttons[index]}
              </Ui.Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {STRINGS.statuses.map(([tone, label]) => (
              <Ui.StatusBadge key={tone} tone={tone}>
                {label}
              </Ui.StatusBadge>
            ))}
            <Ui.Chip variant="soft" tone="accent" size="sm">
              {STRINGS.statuses[3][1]}
            </Ui.Chip>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Ui.TextField label={STRINGS.field} defaultValue={STRINGS.fieldValue} />
            <div className="grid content-end gap-3">
              <Ui.Switch label={STRINGS.notify} defaultValue />
              <Ui.Checkbox label={STRINGS.remember} />
            </div>
          </div>
          <Showcase headingLevel={3} />
        </div>
      </div>
      <div className="material grid gap-3 rounded-3xl p-5">
        <div className="grid gap-1">
          <Ui.Heading level={3} className="[font:var(--h5)]">
            {STRINGS.contrast}
          </Ui.Heading>
          <Ui.Text tone="muted" className="text-sm">
            <bdi>{STRINGS.contrastNote}</bdi>
          </Ui.Text>
        </div>
        <ul className="grid gap-2">
          {PAIRS.map(({ name, fg, bg, needs }) => {
            const ratio = contrastRatio(theme.colors[fg][hex], theme.colors[bg][hex]);
            const isPassing = ratio >= needs;
            return (
              <li key={name} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {/* Lines, not text: the sample shows the theme's pair, which a checker must not take for the page's text. */}
                <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="31"
                    height="31"
                    rx="8"
                    fill={theme.colors[bg][scheme]}
                    stroke={theme.colors[needs === 3 ? fg : "separator"][scheme]}
                  />
                  {needs === 3 ? null : (
                    <g fill={theme.colors[fg][scheme]}>
                      <rect x="8" y="11" width="16" height="3" rx="1.5" />
                      <rect x="8" y="18" width="11" height="3" rx="1.5" />
                    </g>
                  )}
                </svg>
                <span className="flex-1">{name}</span>
                <span className="font-mono text-xs">{`${ratio.toFixed(2)}:1`}</span>
                <Ui.Chip size="sm" variant="soft" tone={isPassing ? "success" : "danger"}>
                  {isPassing ? STRINGS.passes : STRINGS.fails}
                </Ui.Chip>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
