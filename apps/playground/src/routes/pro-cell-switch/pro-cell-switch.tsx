/**
 * Stackra file contract:
 * Purpose: the page of the CellSwitch route: `@stackra/ui-pro`'s CellSwitch, a toggle styled as a settings cell, in a
 *          controlled cell that reports its state, an uncontrolled one that starts on, and disabled ones in both states.
 * Boundary: presentation and local state only. Each cell is named by `label`, the same text as its visible label.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProCellSwitchRoute } from "#src/routes/pro-cell-switch/pro-cell-switch.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-cell-switch.*` keys.
const STRINGS = {
  documentTitle: `${ProCellSwitchRoute.title} · Stackra Playground`,
  intro:
    "A toggle styled as a settings cell: the label on one side and the switch on the other, and the whole row is the target.",
  controlled: "Controlled",
  animations: "Animations",
  sounds: "Sounds",
  state: (isOn: boolean) => `Animations are ${isOn ? "on" : "off"}.`,
  uncontrolled: "Uncontrolled",
  disabled: "Disabled",
  autoplay: "Autoplay",
  haptics: "Haptics",
} as const;

/** A cell with its label, the one shape of every cell on the page. */
function Cell({ label, ...props }: UiPro.CellSwitchProps & { readonly label: string }) {
  return (
    <UiPro.CellSwitch label={label} {...props}>
      <UiPro.CellSwitch.Trigger>
        <UiPro.CellSwitch.Label>{label}</UiPro.CellSwitch.Label>
        <UiPro.CellSwitch.Control />
      </UiPro.CellSwitch.Trigger>
    </UiPro.CellSwitch>
  );
}

/** The CellSwitch page. */
export function ProCellSwitch() {
  const [isOn, setIsOn] = useState(true);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCellSwitchRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-xs gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <Cell label={STRINGS.animations} isSelected={isOn} onChange={setIsOn} />
        <p role="status" className="px-1 text-sm">
          <bdi>{STRINGS.state(isOn)}</bdi>
        </p>
      </section>
      <section aria-labelledby="uncontrolled-heading" className="grid max-w-xs gap-3">
        <h2 id="uncontrolled-heading" className="type-h2">
          {STRINGS.uncontrolled}
        </h2>
        <Cell label={STRINGS.sounds} defaultSelected />
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-xs gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <Cell label={STRINGS.autoplay} defaultSelected isDisabled />
        <Cell label={STRINGS.haptics} isDisabled />
      </section>
    </article>
  );
}
