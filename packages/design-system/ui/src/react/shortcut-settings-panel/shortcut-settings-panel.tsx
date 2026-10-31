/**
 * Stackra file contract:
 * Purpose: the web `ShortcutSettingsPanel`, the person's shortcut settings for a settings screen to host: show keys
 *          beside actions (visible) or in tooltips only (hidden), single-key shortcuts on or off, and a remap list of
 *          every registered action with a key recorder and conflict warnings. A field the tenant locked is shown
 *          read-only with why.
 * Boundary: storage is the host's: `value` and `onChange` (person preferences, ADR 0496, or the dashboard), else the
 *           nearest `ShortcutProvider`'s settings. It changes nothing but the settings it reports.
 * Runtime: browser
 * Governing contract: ADR 0508 (three settings layers; remap; hint modes; single-key off, WCAG 2.2 SC 2.1.4).
 */
import type { ShortcutSettingName } from "@stackra/shortcuts";
import { useShortcutRegistry } from "@stackra/shortcuts/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { SettingRow } from "#react/setting-row/setting-row";
import { ShortcutRecorder } from "#react/shortcut-settings-panel/shortcut-recorder";
import type { ShortcutSettingsPanelProps } from "#react/shortcut-settings-panel/shortcut-settings-panel.props";

/** K: the shortcut words. */
const K = UI_KEYS.ui.shortcuts;

/** The person's shortcut settings. */
export function ShortcutSettingsPanel({
  value,
  onChange,
}: ShortcutSettingsPanelProps): ReactElement {
  const t = useUiText();
  const registry = useShortcutRegistry();
  const settings = value ?? registry.settings;
  const change = onChange ?? registry.setSettings;
  const isLocked = (name: ShortcutSettingName) => settings.locked.includes(name);
  const lockedNote = (name: ShortcutSettingName) => (isLocked(name) ? ` ${t(K.locked)}` : "");
  const modifier = registry.apple ? "⌘" : "Ctrl";
  const seen = new Set<string>();
  const actions = registry.actions.filter((action) => {
    if (action.defaultKeys === undefined || seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <SettingRow
          title={t(K.hint_visible)}
          description={`${t(K.hint_visible_description, { modifier })}${lockedNote("hintMode")}`}
          value={settings.hintMode === "visible"}
          isDisabled={isLocked("hintMode")}
          onChange={(on) => change({ ...settings, hintMode: on ? "visible" : "hidden" })}
        />
        <SettingRow
          title={t(K.single_key)}
          description={`${t(K.single_key_description)}${lockedNote("singleKey")}`}
          value={settings.singleKey}
          isDisabled={isLocked("singleKey")}
          onChange={(on) => change({ ...settings, singleKey: on })}
        />
      </div>
      <section aria-label={t(K.remap)} className="flex flex-col gap-1">
        <h3 className="m-0 text-sm font-medium">{t(K.remap)}</h3>
        {isLocked("remaps") ? <p className="m-0 text-xs text-muted">{t(K.locked)}</p> : null}
        <ul className="m-0 flex list-none flex-col p-0">
          {actions.map((action) => (
            <ShortcutRecorder
              key={action.id}
              action={action}
              registry={registry}
              isLocked={isLocked("remaps")}
              isRemapped={Object.hasOwn(settings.remaps, action.id)}
              onSave={(keys) => {
                const remaps = Object.fromEntries(
                  Object.entries(settings.remaps).filter(([id]) => id !== action.id),
                );
                change({
                  ...settings,
                  remaps: keys === undefined ? remaps : { ...remaps, [action.id]: keys },
                });
              }}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
