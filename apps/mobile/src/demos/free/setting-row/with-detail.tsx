/**
 * Stackra file contract:
 * Purpose: the "with-detail" demo of the native SettingRow: turning tips on fades in the default tip field under the row.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SettingRow, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETTING_ROW_DEMO_KEYS } from "#src/demos/free/setting-row/setting-row-demo-keys.constant";

/** The demo's keys. */
const K = SETTING_ROW_DEMO_KEYS.demo_free.setting_row;

/** Detail on enable. */
export default function WithDetail() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOn, setIsOn] = useState(false);
  return (
    <SettingRow
      icon={Icons.Heart}
      title={t(K.tips)}
      description={t(K.tips_hint)}
      value={isOn}
      onChange={setIsOn}
      detail={<TextField label={t(K.tip_default)} keyboardType="number-pad" defaultValue="10" />}
    />
  );
}
