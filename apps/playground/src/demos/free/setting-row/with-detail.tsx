/**
 * Stackra file contract:
 * Purpose: the "with-detail" demo of the web SettingRow: turning tips on opens the default tip and the custom-amount choice under the row.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 37.
 */
import {
  Checkbox,
  SettingRow as UiSettingRow,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETTING_ROW_KEYS } from "#src/demos/free/setting-row/setting-row-keys.constant";

/** The demo's keys. */
const K = SETTING_ROW_KEYS.setting_row;

/** SettingRow: Detail on enable. */
export default function WithDetail() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOn, setIsOn] = useState(false);
  return (
    <UiSettingRow
      icon={Icons.Wallet}
      title={t(K.tips)}
      description={t(K.tips_hint)}
      value={isOn}
      onChange={setIsOn}
      detail={
        <div className="grid gap-3 ps-8">
          <TextField
            label={t(K.tip_default)}
            inputMode="decimal"
            defaultValue="10"
            isFullWidth={false}
          />
          <Checkbox label={t(K.tip_custom)} defaultValue />
        </div>
      }
    />
  );
}
