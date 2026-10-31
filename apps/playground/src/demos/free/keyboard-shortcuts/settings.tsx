/**
 * Stackra file contract:
 * Purpose: the "settings" demo of the shortcut-aware UI: the person's shortcut settings: the hint mode, single-key shortcuts and a remap list with a key recorder and conflict warnings. The settings live in local state here; an app stores them in person preferences (ADR 0496).
 * Boundary: a demo with no props, @stackra/ui, @stackra/shortcuts and local state only; the same file is the preview and
 *           the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0508; ADR 0060 (light, dark,
 *          RTL).
 */
import { DEFAULT_SHORTCUT_SETTINGS, type ShortcutSettings } from "@stackra/shortcuts";
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { Button, ShortcutSettingsPanel, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { KEYBOARD_SHORTCUTS_KEYS } from "#src/demos/free/keyboard-shortcuts/keyboard-shortcuts-keys.constant";

/** The demo's keys. */
const K = KEYBOARD_SHORTCUTS_KEYS.keyboard_shortcuts;

/** The settings panel over local state, with buttons that follow it. */
export default function Settings() {
  const t = useCatalogueText(MESSAGES.en);
  const [settings, setSettings] = useState<ShortcutSettings>(DEFAULT_SHORTCUT_SETTINGS);
  const [ran, setRan] = useState("");
  const actions = [
    { id: "demo.new_order", label: t(K.new_order), shortcut: "alt+shift+n" },
    { id: "demo.print", label: t(K.print), shortcut: "alt+shift+p" },
    { id: "demo.comment", label: t(K.comment), shortcut: "m" },
  ];
  return (
    <ShortcutProvider settings={settings} onSettingsChange={setSettings}>
      <div className="flex w-full max-w-xl flex-col gap-4">
        <p className="m-0 text-sm text-muted">{t(K.settings_help)}</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="secondary"
              shortcut={action.shortcut}
              shortcutId={action.id}
              onPress={() => setRan(action.label)}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <p role="status" className="m-0 text-xs text-muted">
          {ran ? t(K.ran, { action: ran }) : ""}
        </p>
        <ShortcutSettingsPanel value={settings} onChange={setSettings} />
      </div>
    </ShortcutProvider>
  );
}
