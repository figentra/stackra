/**
 * Stackra file contract:
 * Purpose: the page of the CellColorPicker route: `@stackra/ui-pro`'s CellColorPicker, a colour picker styled as a
 *          settings cell, in a controlled cell that reports the colour as hex, an uncontrolled one, and a disabled one.
 * Boundary: presentation and local state only. The trigger button is named by `label`; the root draws no element, so it
 *          takes none. The popover holds a named colour area and a named hue slider.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { ColorArea, ColorSlider, Label, parseColor } from "@heroui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProCellColorPickerRoute } from "#src/routes/pro-cell-color-picker/pro-cell-color-picker.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-cell-color-picker.*` keys.
const STRINGS = {
  documentTitle: `${ProCellColorPickerRoute.title} · Stackra Playground`,
  intro:
    "A colour picker styled as a settings cell: the label, the colour as text and a swatch on one row, and a press opens a colour area and a hue slider.",
  controlled: "Controlled",
  accent: "Accent",
  chosen: (hex: string) => `Accent: ${hex}.`,
  uncontrolled: "Uncontrolled",
  highlight: "Highlight",
  disabled: "Disabled",
  border: "Border",
  area: "Colour area",
  hue: "Hue",
} as const;

/** The popover of a cell: a saturation and brightness area and a hue slider. */
function Controls() {
  return (
    <UiPro.CellColorPicker.Popover>
      <ColorArea
        aria-label={STRINGS.area}
        className="max-w-full"
        colorSpace="hsb"
        xChannel="saturation"
        yChannel="brightness"
      >
        <ColorArea.Thumb />
      </ColorArea>
      <ColorSlider aria-label={STRINGS.hue} channel="hue" className="gap-1 px-1" colorSpace="hsb">
        <Label>{STRINGS.hue}</Label>
        <ColorSlider.Output className="text-muted" />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </UiPro.CellColorPicker.Popover>
  );
}

/** The trigger of a cell: the label, the colour as text and the swatch. */
function Trigger({ label, isDisabled }: { readonly label: string; readonly isDisabled?: boolean }) {
  return (
    <UiPro.CellColorPicker.Trigger label={label} {...(isDisabled ? { isDisabled } : {})}>
      <UiPro.CellColorPicker.Label>{label}</UiPro.CellColorPicker.Label>
      <UiPro.CellColorPicker.ValueDisplay />
      <UiPro.CellColorPicker.Swatch />
    </UiPro.CellColorPicker.Trigger>
  );
}

/** The CellColorPicker page. */
export function ProCellColorPicker() {
  const [color, setColor] = useState(() => parseColor("#3B82F6"));

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCellColorPickerRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-xs gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <UiPro.CellColorPicker value={color} onChange={setColor}>
          <Trigger label={STRINGS.accent} />
          <Controls />
        </UiPro.CellColorPicker>
        <p role="status" className="px-1 text-sm">
          <bdi>{STRINGS.chosen(color.toString("hex").toUpperCase())}</bdi>
        </p>
      </section>
      <section aria-labelledby="uncontrolled-heading" className="grid max-w-xs gap-3">
        <h2 id="uncontrolled-heading" className="type-h2">
          {STRINGS.uncontrolled}
        </h2>
        <UiPro.CellColorPicker defaultValue="#10B981">
          <Trigger label={STRINGS.highlight} />
          <Controls />
        </UiPro.CellColorPicker>
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-xs gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <UiPro.CellColorPicker defaultValue="#F59E0B" isDisabled>
          <Trigger label={STRINGS.border} isDisabled />
          <Controls />
        </UiPro.CellColorPicker>
      </section>
    </article>
  );
}
