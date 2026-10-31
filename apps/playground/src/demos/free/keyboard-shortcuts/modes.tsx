/**
 * Stackra file contract:
 * Purpose: the "modes" demo of the shortcut-aware UI: the two hint modes side by side: keys visible beside each action (an inline HeroUI Kbd), or hidden, shown in the tooltip on hover and focus.
 * Boundary: a demo with no props, @stackra/ui, @stackra/shortcuts and local state only; the same file is the preview and
 *           the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0508; ADR 0060 (light, dark,
 *          RTL).
 */
import { DEFAULT_SHORTCUT_SETTINGS, type ShortcutHintMode } from "@stackra/shortcuts";
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { Button, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { KEYBOARD_SHORTCUTS_KEYS } from "#src/demos/free/keyboard-shortcuts/keyboard-shortcuts-keys.constant";

/** The demo's keys. */
const K = KEYBOARD_SHORTCUTS_KEYS.keyboard_shortcuts;

/** One panel in one hint mode, with its own registry so the two panels never share keys. */
function Panel({ mode, digit }: { readonly mode: ShortcutHintMode; readonly digit: number }) {
  const t = useCatalogueText(MESSAGES.en);
  const [ran, setRan] = useState("");
  const words = [t(K.bold), t(K.italic), t(K.underline)];
  return (
    <ShortcutProvider settings={{ ...DEFAULT_SHORTCUT_SETTINGS, hintMode: mode }}>
      <section
        aria-label={mode === "visible" ? t(K.visible) : t(K.hidden)}
        className="flex flex-1 flex-col gap-3 border border-separator p-4"
      >
        <h3 className="m-0 text-sm font-medium">
          {mode === "visible" ? t(K.visible) : t(K.hidden)}
        </h3>
        <p className="m-0 text-xs text-muted">
          {mode === "visible" ? t(K.visible_help) : t(K.hidden_help)}
        </p>
        <div className="flex flex-wrap gap-2">
          {words.map((word, index) => (
            <Button
              key={word}
              variant="secondary"
              shortcut={`alt+shift+${digit + index}`}
              onPress={() => setRan(word)}
            >
              {word}
            </Button>
          ))}
        </div>
        <p role="status" className="m-0 text-xs text-muted">
          {ran ? t(K.ran, { action: ran }) : ""}
        </p>
      </section>
    </ShortcutProvider>
  );
}

/** Visible and hidden hint modes. */
export default function Modes() {
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <Panel mode="visible" digit={1} />
      <Panel mode="hidden" digit={4} />
    </div>
  );
}
