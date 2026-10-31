/**
 * Stackra file contract:
 * Purpose: `ShortcutSettings`, the resolved shortcut settings of one person on one tenant: on or off, the hint mode,
 *          whether single-character shortcuts fire, the remapped bindings by action id, and which fields are locked.
 * Boundary: a type only; runtime configuration, never code (ADR 0496): `resolveShortcutSettings` builds it from the
 *           platform, tenant and person layers, and the person-preferences store keeps the person's layer.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (three settings layers); ADR 0496 (person preferences, the `shortcuts` group).
 */
import type { ShortcutHintMode } from "#core/enums/shortcut-hint-mode.enum";
import type { ShortcutSettingName } from "#core/types/shortcut-setting-name.type";

/** The shortcut settings in force. */
export interface ShortcutSettings {
  /** False turns every registered shortcut and hint off. */
  readonly enabled: boolean;
  /** `visible`: a key hint beside each action; `hidden`: the keys in its tooltip only. */
  readonly hintMode: ShortcutHintMode;
  /** False stops shortcuts made of one character key (`e`, `/`, `?`), WCAG 2.2 SC 2.1.4. */
  readonly singleKey: boolean;
  /** A binding per action id that replaces the action's own; `null` unbinds it. */
  readonly remaps: Readonly<Record<string, string | null>>;
  /** The fields a higher layer (platform or tenant) locked, which the person cannot change. */
  readonly locked: readonly ShortcutSettingName[];
}
