/**
 * Stackra file contract:
 * Purpose: the page of the PressableFeedback route: `@stackra/ui-pro`'s PressableFeedback as two press tiles, one
 *          with a ripple and one with a highlight, that count their presses in text, and a disabled tile, each a real
 *          button named by its text.
 * Boundary: presentation and local state only. The feedback is visual and extra; the press, the count and the name come
 *          from the button.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProPressableFeedbackRoute } from "#src/routes/pro-pressable-feedback/pro-pressable-feedback.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-pressable-feedback.*` keys.
const STRINGS = {
  documentTitle: `${ProPressableFeedbackRoute.title} · Stackra Playground`,
  intro:
    "Press feedback for any pressable surface: a ripple that spreads from the pointer, or a highlight that fills the surface.",
  tiles: "Tiles",
  disabled: "Disabled",
  ripple: "Ripple tile",
  highlight: "Highlight tile",
  off: "Unavailable tile",
  text: "Press me",
  pressed: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}`,
} as const;

const TILE =
  "relative overflow-hidden rounded-xl border border-border bg-surface p-4 text-start text-foreground";

/** The PressableFeedback page. */
export function ProPressableFeedback() {
  const [ripple, setRipple] = useState(0);
  const [highlight, setHighlight] = useState(0);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProPressableFeedbackRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="tiles-heading" className="grid gap-3">
        <h2 id="tiles-heading" className="type-h2">
          {STRINGS.tiles}
        </h2>
        <div className="flex flex-wrap gap-4">
          <UiPro.PressableFeedback className={TILE} onClick={() => setRipple(ripple + 1)}>
            <UiPro.PressableFeedback.Ripple />
            <span className="block font-medium">{STRINGS.ripple}</span>
            <span className="block text-sm">{STRINGS.pressed(ripple)}</span>
          </UiPro.PressableFeedback>
          <UiPro.PressableFeedback className={TILE} onClick={() => setHighlight(highlight + 1)}>
            <UiPro.PressableFeedback.Highlight />
            <span className="block font-medium">{STRINGS.highlight}</span>
            <span className="block text-sm">{STRINGS.pressed(highlight)}</span>
          </UiPro.PressableFeedback>
        </div>
      </section>
      <section aria-labelledby="disabled-heading" className="grid gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <div>
          <UiPro.PressableFeedback className={TILE} isDisabled>
            <UiPro.PressableFeedback.Ripple />
            <span className="block font-medium">{STRINGS.off}</span>
            <span className="block text-sm">{STRINGS.text}</span>
          </UiPro.PressableFeedback>
        </div>
      </section>
    </article>
  );
}
