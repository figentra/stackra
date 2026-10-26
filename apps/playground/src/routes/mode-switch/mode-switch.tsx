/**
 * Stackra file contract:
 * Purpose: the page of the Mode switch route: `@stackra/ui`'s ModeSwitch turning the developer display mode on and
 *          off, with the mode it reports written under it.
 * Boundary: presentation only; the mode is local state. What developer mode shows (ids, keys, raw values) is the
 *           app's.
 * Runtime: browser
 * Governing contract: ADR 0060 (light, dark, RTL); STA-803.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { ModeSwitchRoute } from "#src/routes/mode-switch/mode-switch.route";

// shortcut: English strings in one place until the playground reads `playground::*` keys (STA-788).
const STRINGS = {
  documentTitle: `${ModeSwitchRoute.title} · Stackra Playground`,
  intro:
    "Turns the developer display mode on and off: ids, keys and raw values appear beside the friendly labels.",
  demo: "Display mode",
  label: "Developer mode",
  description: "Show ids, keys and raw values.",
  current: (mode: string) => `Current mode: ${mode}`,
} as const;

/** The Mode switch page. */
export function ModeSwitch() {
  const [mode, setMode] = useState<"normal" | "developer">("normal");
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ModeSwitchRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="demo-heading" className="grid max-w-xl gap-3">
        <h2 id="demo-heading" className="type-h2">
          {STRINGS.demo}
        </h2>
        <Ui.ModeSwitch
          label={STRINGS.label}
          description={STRINGS.description}
          mode={mode}
          onModeChange={setMode}
        />
        <p role="status" className="text-sm text-muted">
          {STRINGS.current(mode)}
        </p>
      </section>
    </article>
  );
}
