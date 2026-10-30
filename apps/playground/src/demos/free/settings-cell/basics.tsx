/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Settings cell: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import {
  ItemCardGroup,
  SettingsColorCell,
  SettingsSelectCell,
  SettingsSliderCell,
  SettingsSwitchCell,
  useCatalogueText,
} from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETTINGS_CELL_KEYS } from "#src/demos/free/settings-cell/settings-cell-keys.constant";

/** The demo's keys. */
const K = SETTINGS_CELL_KEYS.settings_cell.basics;

/** Settings cell: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <ItemCardGroup title={t(K.title)}>
        <SettingsSwitchCell
          title={t(K.print)}
          description={t(K.print_line)}
          icon={Icons.Printer}
          defaultValue
        />
        <SettingsSelectCell
          title={t(K.paper)}
          icon={Icons.ScrollText}
          items={[
            { id: "58", label: t(K.small) },
            { id: "80", label: t(K.large) },
          ]}
          defaultValue="80"
        />
        <SettingsSliderCell
          title={t(K.size)}
          icon={Icons.Type}
          minValue={80}
          maxValue={140}
          step={10}
          defaultValue={100}
          formatOptions={{ style: "unit", unit: "percent" }}
        />
        <SettingsColorCell title={t(K.accent)} icon={Icons.Palette} defaultValue="#4f46e5" />
      </ItemCardGroup>
    </div>
  );
}
