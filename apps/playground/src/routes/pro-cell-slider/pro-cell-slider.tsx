/**
 * Stackra file contract:
 * Purpose: the page of the CellSlider route: `@stackra-pro/ui`'s CellSlider, a range slider styled as a settings cell, in
 *          a controlled cell that reports its value, an uncontrolled one, and a disabled one.
 * Boundary: presentation and local state only. Each cell is named by `label`, the same text as its visible label.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProCellSliderRoute } from "#src/routes/pro-cell-slider/pro-cell-slider.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-cell-slider.*` keys.
const STRINGS = {
  documentTitle: `${ProCellSliderRoute.title} · Stackra Playground`,
  intro:
    "A range slider styled as a settings cell: the label and the value sit on the track, and the thumb moves with a drag or the arrow keys.",
  controlled: "Controlled",
  spacing: "Spacing",
  value: (value: number) => `Spacing is ${value.toFixed(2)}.`,
  uncontrolled: "Uncontrolled",
  volume: "Volume",
  disabled: "Disabled",
  brightness: "Brightness",
} as const;

const FORMAT = { maximumFractionDigits: 2, minimumFractionDigits: 2 } as const;

/** A cell with its label, the one shape of every cell on the page. */
function Cell({ label, ...props }: UiPro.CellSliderProps & { readonly label: string }) {
  return (
    <UiPro.CellSlider
      label={label}
      formatOptions={FORMAT}
      minValue={0}
      maxValue={1}
      step={0.01}
      {...props}
    >
      <UiPro.CellSlider.Track>
        <UiPro.CellSlider.Fill />
        <UiPro.CellSlider.Thumb />
        <UiPro.CellSlider.Label>{label}</UiPro.CellSlider.Label>
        <UiPro.CellSlider.Output />
      </UiPro.CellSlider.Track>
    </UiPro.CellSlider>
  );
}

/** The CellSlider page. */
export function ProCellSlider() {
  const [spacing, setSpacing] = useState(0.5);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCellSliderRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-xs gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <Cell
          label={STRINGS.spacing}
          value={spacing}
          onChange={(value) => setSpacing(Array.isArray(value) ? (value[0] ?? 0) : value)}
        />
        <p role="status" className="px-1 text-sm">
          <bdi>{STRINGS.value(spacing)}</bdi>
        </p>
      </section>
      <section aria-labelledby="uncontrolled-heading" className="grid max-w-xs gap-3">
        <h2 id="uncontrolled-heading" className="type-h2">
          {STRINGS.uncontrolled}
        </h2>
        <Cell label={STRINGS.volume} defaultValue={0.75} />
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-xs gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <Cell label={STRINGS.brightness} defaultValue={0.3} isDisabled />
      </section>
    </article>
  );
}
