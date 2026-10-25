/**
 * Stackra file contract:
 * Purpose: the Theme Studio's controls:
 *          - the theme's name;
 *          - presets (Stackra, Steel, Ember, Moss, Violet);
 *          - an accent colour (on or off, its hue and chroma);
 *          - the hue and chroma the neutrals lean to;
 *          - the base radius;
 *          - the Latin and Arabic faces.
 *          Each control reports a whole new set of knobs, so the page keeps one history of them. The sliders are
 *          native range inputs, each labelled and showing its value.
 * Boundary: the controls only; the theme is derived by the page (`deriveTheme`).
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2.
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";
import * as Ui from "@stackra/ui/react";
import { useId } from "react";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::studio.controls.*` keys.
const STRINGS = {
  title: "Controls",
  name: "Theme name",
  nameNote: "Lower case words joined by hyphens, as in acme-dark.",
  preset: "Preset",
  custom: "Custom",
  accent: "Accent colour",
  accentHue: "Accent hue",
  accentChroma: "Accent strength",
  neutral: "Neutrals",
  neutralHue: "Neutral hue",
  neutralChroma: "Neutral tint",
  radius: "Corner radius",
  latin: "Latin face",
  arabic: "Arabic face",
} as const;

/** The presets: a name and the knobs it sets. */
export const STUDIO_PRESETS: readonly { id: string; label: string; knobs: ThemeKnobs }[] = [
  { id: "stackra", label: "Stackra", knobs: {} },
  {
    id: "steel",
    label: "Steel",
    knobs: { accent: { hue: 248, chroma: 0.09 }, neutralHue: 248, neutralChroma: 0.012 },
  },
  {
    id: "ember",
    label: "Ember",
    knobs: { accent: { hue: 40, chroma: 0.16 }, neutralHue: 60, neutralChroma: 0.008, radius: 8 },
  },
  {
    id: "moss",
    label: "Moss",
    knobs: { accent: { hue: 150, chroma: 0.12 }, neutralHue: 140, neutralChroma: 0.008, radius: 6 },
  },
  {
    id: "violet",
    label: "Violet",
    knobs: { accent: { hue: 295, chroma: 0.15 }, neutralHue: 290, neutralChroma: 0.01, radius: 12 },
  },
];

/** The faces the controls offer, by id: a label and the font stack. */
export const STUDIO_FACES = {
  latin: [
    { id: "geist", label: "Geist", stack: '"Geist", ui-sans-serif, system-ui, sans-serif' },
    { id: "system", label: "System", stack: 'system-ui, "Segoe UI", sans-serif' },
    { id: "serif", label: "Serif", stack: "ui-serif, Georgia, serif" },
    { id: "mono", label: "Geist Mono", stack: '"Geist Mono", ui-monospace, monospace' },
  ],
  arabic: [
    {
      id: "plex",
      label: "IBM Plex Sans Arabic",
      stack: '"IBM Plex Sans Arabic", "Geist", system-ui, "Segoe UI", "Tahoma", sans-serif',
    },
    { id: "system", label: "System", stack: 'system-ui, "Segoe UI", "Tahoma", sans-serif' },
  ],
} as const;

/** Props of {@link StudioControls}. */
export interface StudioControlsProps {
  /** The knobs on screen. */
  knobs: ThemeKnobs;
  /** Called with the whole new set of knobs after a change. */
  onChange: (knobs: ThemeKnobs) => void;
}

/** One labelled range input that shows its value. */
function Range({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  isDisabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  isDisabled?: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs text-muted">
          {`${value}${unit}`}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={isDisabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-6 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

/** The studio's controls. */
export function StudioControls({ knobs, onChange }: StudioControlsProps) {
  const accent = knobs.accent ?? null;
  const set = (change: ThemeKnobs) => onChange({ ...knobs, ...change });
  const preset = STUDIO_PRESETS.find(
    ({ knobs: candidate }) => JSON.stringify(candidate) === JSON.stringify(knobs),
  );

  return (
    <section
      aria-labelledby="studio-controls"
      className="material-thick grid content-start gap-5 rounded-3xl p-5"
    >
      <Ui.Heading id="studio-controls" level={2} className="[font:var(--h4)]">
        {STRINGS.title}
      </Ui.Heading>
      <Ui.TextField
        label={STRINGS.name}
        description={<bdi>{STRINGS.nameNote}</bdi>}
        value={knobs.name ?? ""}
        placeholder="stackra"
        onChange={(name) => set({ name: name === "" ? undefined : name })}
      />
      <Ui.Select
        label={STRINGS.preset}
        placeholder={STRINGS.custom}
        items={STUDIO_PRESETS.map(({ id, label }) => ({ id, label }))}
        value={preset?.id ?? ""}
        onChange={(id) => {
          const picked = STUDIO_PRESETS.find((candidate) => candidate.id === id);
          if (picked) onChange(picked.knobs);
        }}
      />
      <Ui.Separator />
      <div className="grid gap-3">
        <Ui.Switch
          label={STRINGS.accent}
          value={accent !== null}
          onChange={(isOn) => set({ accent: isOn ? { hue: 248, chroma: 0.12 } : null })}
        />
        <Range
          label={STRINGS.accentHue}
          value={accent?.hue ?? 248}
          min={0}
          max={360}
          step={1}
          unit="°"
          isDisabled={accent === null}
          onChange={(hue) => set({ accent: { hue, chroma: accent?.chroma ?? 0.12 } })}
        />
        <Range
          label={STRINGS.accentChroma}
          value={accent?.chroma ?? 0.12}
          min={0.02}
          max={0.3}
          step={0.01}
          isDisabled={accent === null}
          onChange={(chroma) => set({ accent: { hue: accent?.hue ?? 248, chroma } })}
        />
      </div>
      <Ui.Separator />
      <div className="grid gap-3">
        <p className="text-sm font-medium">{STRINGS.neutral}</p>
        <Range
          label={STRINGS.neutralHue}
          value={knobs.neutralHue ?? 248}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(neutralHue) => set({ neutralHue })}
        />
        <Range
          label={STRINGS.neutralChroma}
          value={knobs.neutralChroma ?? 0.005}
          min={0}
          max={0.03}
          step={0.001}
          onChange={(neutralChroma) => set({ neutralChroma })}
        />
        <Range
          label={STRINGS.radius}
          value={knobs.radius ?? 4}
          min={0}
          max={20}
          step={1}
          unit="px"
          onChange={(radius) => set({ radius })}
        />
      </div>
      <Ui.Separator />
      <Ui.Select
        label={STRINGS.latin}
        items={STUDIO_FACES.latin.map(({ id, label }) => ({ id, label }))}
        value={
          STUDIO_FACES.latin.find(({ stack }) => stack === knobs.fontSans)?.id ??
          STUDIO_FACES.latin[0].id
        }
        onChange={(id) =>
          set({ fontSans: STUDIO_FACES.latin.find((face) => face.id === id)?.stack })
        }
      />
      <Ui.Select
        label={STRINGS.arabic}
        items={STUDIO_FACES.arabic.map(({ id, label }) => ({ id, label }))}
        value={
          STUDIO_FACES.arabic.find(({ stack }) => stack === knobs.fontArabic)?.id ??
          STUDIO_FACES.arabic[0].id
        }
        onChange={(id) =>
          set({ fontArabic: STUDIO_FACES.arabic.find((face) => face.id === id)?.stack })
        }
      />
    </section>
  );
}
