/**
 * Stackra file contract:
 * Purpose: `ShortcutSettingsPanelContractProps`, what the shortcut settings panel takes: the settings to show and the
 *          callback that stores the person's change. Left out, it reads and writes the nearest `ShortcutProvider`.
 * Boundary: types only; storage is the host's (the person-preferences `shortcuts` group of ADR 0496, or the
 *           dashboard for a tenant), never the panel's.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (settings layers); ADR 0496.
 */
import type { ShortcutSettings } from "@stackra/shortcuts";

/** Props of the shortcut settings panel. */
export interface ShortcutSettingsPanelContractProps {
  /** The settings in force, controlled. Defaults to the nearest provider's. */
  readonly value?: ShortcutSettings | undefined;
  /** Called with the whole new settings when the person changes one; persist it here. */
  readonly onChange?: ((settings: ShortcutSettings) => void) | undefined;
}
