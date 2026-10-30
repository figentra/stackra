/**
 * Stackra file contract:
 * Purpose: the "pos-settings" demo of the web SettingRow: a terminal's switches (print receipts, sale sounds, offline sales), each with its icon and one line on what it does.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 37.
 */
import { Separator, SettingRow as UiSettingRow, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETTING_ROW_KEYS } from "#src/demos/free/setting-row/setting-row-keys.constant";

/** The demo's keys. */
const K = SETTING_ROW_KEYS.setting_row;

/** SettingRow: POS settings. */
export default function PosSettings() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div role="group" aria-label={t(K.list)} className="grid">
      <UiSettingRow
        icon={Icons.Receipt}
        title={t(K.receipts)}
        description={t(K.receipts_hint)}
        defaultValue
      />
      <Separator />
      <UiSettingRow
        icon={Icons.Bell}
        title={t(K.sounds)}
        description={t(K.sounds_hint)}
        defaultValue={false}
      />
      <Separator />
      <UiSettingRow
        icon={Icons.Zap}
        title={t(K.offline)}
        description={t(K.offline_hint)}
        defaultValue={false}
      />
    </div>
  );
}
