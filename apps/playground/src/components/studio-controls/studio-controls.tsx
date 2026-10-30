/**
 * Stackra file contract:
 * Purpose: the Theme Studio's controls, one rail section at a time:
 *          - brand: the theme's name;
 *          - colours: presets (the base theme as it is, Ember, Moss, Violet), a custom accent (on or off, its hue and
 *            chroma) and the hue and chroma the neutrals lean to;
 *          - type: the Latin and Arabic UI faces and display faces;
 *          - shape: the base radius and the theme's radius steps;
 *          - motion: the theme's motion steps, each played on hover;
 *          - effects: the glass blur of each material level and the theme's shadows.
 *          A knob left unset shows the base theme's own value (the picked brand's), so the controls always describe
 *          the theme on the canvas. Each control reports a whole new set of knobs, so the page keeps one history.
 * Boundary: the controls only; the theme is derived by the page (`deriveTheme`).
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2.
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";
import { MaterialLevel } from "@stackra/tokens/contracts";
import { Select, Switch, Text, TextField, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { faceOf } from "./face-of.function";
import { oklchParts } from "./oklch-parts.function";
import { pxOf } from "./px-of.function";
import type { StudioControlsProps } from "./studio-controls.props";
import { STUDIO_FACES } from "./studio-faces.constant";
import { STUDIO_PRESETS } from "./studio-presets.constant";
import { StudioRange } from "./studio-range";

/** The controls' keys. */
const K = THEME_STUDIO_KEYS.theme_studio.controls;

/** The colour knobs a preset sets, as one comparable string. */
const colourKnobs = ({ accent, neutralHue, neutralChroma, radius }: ThemeKnobs) =>
  JSON.stringify({ accent: accent ?? undefined, neutralHue, neutralChroma, radius });

/** The picker items of `families`, with `current` added when the list lacks it. */
const familyItems = (families: readonly string[], current: string) =>
  [...new Set([...families, current])].map((family) => ({ id: family, label: family }));

/** The studio's controls of one section. */
export function StudioControls({
  section,
  knobs,
  base,
  baseLabel,
  fonts,
  scheme,
  onChange,
}: StudioControlsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const set = (change: Partial<typeof knobs>) => onChange({ ...knobs, ...change });

  if (section === "brand") {
    return (
      <TextField
        label={t(K.name)}
        description={<bdi>{t(K.name_note)}</bdi>}
        value={knobs.name ?? base.name}
        onChange={(name) => set({ name: name === "" || name === base.name ? undefined : name })}
      />
    );
  }

  if (section === "colours") {
    // The base's own accent and neutrals, so the sliders start where the theme is.
    const baseAccent = oklchParts(base.colors.accent.light, base.colors.accent.hexLight);
    const baseNeutral = oklchParts(base.colors.border.light, base.colors.border.hexLight);
    const accent = knobs.accent ?? null;
    const startAccent = {
      hue: Math.round(baseAccent?.hue ?? 248),
      chroma: Math.min(0.37, Number((baseAccent?.chroma ?? 0.12).toFixed(2))),
    };
    const preset = STUDIO_PRESETS.find(
      (candidate) => colourKnobs(candidate.knobs) === colourKnobs(knobs),
    );
    return (
      <div className="grid gap-4">
        <Select
          label={t(K.preset)}
          placeholder={t(K.custom)}
          items={STUDIO_PRESETS.map(({ id }) => ({
            id,
            label: id === "base" ? baseLabel : t(K.presets[id]),
          }))}
          value={preset?.id ?? ""}
          onChange={(id) => {
            const picked = STUDIO_PRESETS.find((candidate) => candidate.id === id);
            if (picked)
              onChange({
                ...knobs,
                accent: undefined,
                neutralHue: undefined,
                neutralChroma: undefined,
                radius: undefined,
                ...picked.knobs,
              });
          }}
        />
        <Switch
          label={t(K.accent)}
          value={accent !== null}
          onChange={(isOn) => set({ accent: isOn ? startAccent : null })}
        />
        <StudioRange
          label={t(K.accent_hue)}
          value={accent?.hue ?? startAccent.hue}
          min={0}
          max={360}
          step={1}
          unit="°"
          isDisabled={accent === null}
          onChange={(hue) => set({ accent: { hue, chroma: accent?.chroma ?? startAccent.chroma } })}
        />
        <StudioRange
          label={t(K.accent_chroma)}
          value={accent?.chroma ?? startAccent.chroma}
          min={0}
          max={0.37}
          step={0.01}
          isDisabled={accent === null}
          onChange={(chroma) => set({ accent: { hue: accent?.hue ?? startAccent.hue, chroma } })}
        />
        <p className="pt-1 text-sm font-medium">{t(K.neutral)}</p>
        <StudioRange
          label={t(K.neutral_hue)}
          value={knobs.neutralHue ?? Math.round(baseNeutral?.hue ?? 248)}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(neutralHue) => set({ neutralHue })}
        />
        <StudioRange
          label={t(K.neutral_chroma)}
          value={
            knobs.neutralChroma ?? Math.min(0.03, Number((baseNeutral?.chroma ?? 0.005).toFixed(3)))
          }
          min={0}
          max={0.03}
          step={0.001}
          onChange={(neutralChroma) => set({ neutralChroma })}
        />
      </div>
    );
  }

  if (section === "type") {
    const sans = knobs.fontSans ?? base.fontFamily.sans;
    const arabic = knobs.fontArabic ?? base.fontFamily.arabic;
    // A face the list does not offer (an imported theme's) is shown by its name, so the picker never lies.
    const latinItems = [
      ...STUDIO_FACES.latin.map(({ id }) => ({ id, label: t(K.faces[id]) })),
      ...(STUDIO_FACES.latin.some(({ stack }) => stack === sans)
        ? []
        : [{ id: "theme", label: faceOf(sans) }]),
    ];
    const arabicItems = [
      ...STUDIO_FACES.arabic.map(({ id }) => ({ id, label: t(K.faces[id]) })),
      ...(STUDIO_FACES.arabic.some(({ stack }) => stack === arabic)
        ? []
        : [{ id: "theme", label: faceOf(arabic) }]),
    ];
    const display = knobs.display ?? faceOf(fonts.display);
    const displayArabic = knobs.displayArabic ?? faceOf(fonts.displayArabic);
    return (
      <div className="grid gap-4">
        <Select
          label={t(K.display)}
          items={familyItems(STUDIO_FACES.display, display)}
          value={display}
          onChange={(id) => set({ display: id ?? undefined })}
        />
        <Select
          label={t(K.display_arabic)}
          items={familyItems(STUDIO_FACES.displayArabic, displayArabic)}
          value={displayArabic}
          onChange={(id) => set({ displayArabic: id ?? undefined })}
        />
        <Select
          label={t(K.latin)}
          items={latinItems}
          value={STUDIO_FACES.latin.find(({ stack }) => stack === sans)?.id ?? "theme"}
          onChange={(id) =>
            set({ fontSans: STUDIO_FACES.latin.find((face) => face.id === id)?.stack })
          }
        />
        <Select
          label={t(K.arabic)}
          items={arabicItems}
          value={STUDIO_FACES.arabic.find(({ stack }) => stack === arabic)?.id ?? "theme"}
          onChange={(id) =>
            set({ fontArabic: STUDIO_FACES.arabic.find((face) => face.id === id)?.stack })
          }
        />
      </div>
    );
  }

  if (section === "shape") {
    const steps = Object.entries(base.radius.steps).filter(([, value]) => value !== "9999px");
    return (
      <div className="grid gap-4">
        <StudioRange
          label={t(K.radius)}
          value={knobs.radius ?? pxOf(base.radius.base) ?? 4}
          min={0}
          max={24}
          step={1}
          unit="px"
          onChange={(radius) => set({ radius })}
        />
        <div className="grid gap-2">
          <p className="text-sm font-medium">{t(K.radius_steps)}</p>
          <ul className="grid grid-cols-3 gap-2">
            {steps.map(([name, value]) => (
              <li key={name} className="grid justify-items-center gap-1 text-xs">
                <span
                  aria-hidden="true"
                  className="size-10 border-2 border-accent bg-accent-soft"
                  style={{ borderRadius: value }}
                />
                <span className="font-mono text-muted" dir="ltr">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (section === "motion") {
    return (
      <div className="grid gap-3">
        <Text tone="muted" type="small">
          <bdi>{t(K.motion_note)}</bdi>
        </Text>
        <ul className="grid gap-1">
          {Object.entries(base.motion).map(([name, { duration, easing }]) => (
            <li
              key={name}
              className="group grid gap-1 p-2 text-xs hover:bg-default"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium" dir="ltr">
                  {name}
                </span>
                <span className="font-mono text-muted" dir="ltr">
                  {duration}
                </span>
              </span>
              <span className="relative h-2">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 start-0 w-2 bg-accent transition-[inset-inline-start] group-hover:start-[calc(100%-0.5rem)] motion-reduce:transition-none"
                  style={{
                    borderRadius: "var(--radius-full)",
                    transitionDuration: duration,
                    transitionTimingFunction: easing,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm font-medium">{t(K.blur)}</p>
      {MaterialLevel.map((level) => (
        <StudioRange
          key={level}
          label={t(K.levels[level])}
          value={knobs.materials?.[level]?.blur ?? pxOf(base.materials.levels[level].blur) ?? 0}
          min={0}
          max={48}
          step={1}
          unit="px"
          onChange={(blur) =>
            set({
              materials: { ...knobs.materials, [level]: { ...knobs.materials?.[level], blur } },
            })
          }
        />
      ))}
      <p className="pt-1 text-sm font-medium">{t(K.shadows)}</p>
      <ul className="grid grid-cols-3 gap-3">
        {(["surface", "overlay", "field"] as const).map((name) => (
          <li key={name} className="grid justify-items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="h-10 w-full bg-surface"
              style={{ borderRadius: "var(--radius-lg)", boxShadow: base.shadows[name][scheme] }}
            />
            <span className="text-muted">{t(K.shadow_names[name])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
