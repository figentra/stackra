/**
 * Stackra file contract:
 * Purpose: the "pos-settings" demo of the native SettingRow: a terminal's switches, each row one accessible switch with a selection haptic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Separator, SettingRow, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETTING_ROW_DEMO_KEYS } from "#src/demos/free/setting-row/setting-row-demo-keys.constant";

/** The demo's keys. */
const K = SETTING_ROW_DEMO_KEYS.demo_free.setting_row;

/** The SettingRow demo: a point of sale settings list. */
export default function PosSettings() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <SettingRow
        icon={Icons.Archive}
        title={t(K.receipts)}
        description={t(K.receipts_hint)}
        defaultValue
      />
      <Separator />
      <SettingRow
        icon={Icons.Bell}
        title={t(K.sounds)}
        description={t(K.sounds_hint)}
        defaultValue={false}
      />
      <Separator />
      <SettingRow
        icon={Icons.Download}
        title={t(K.offline)}
        description={t(K.offline_hint)}
        defaultValue={false}
      />
    </View>
  );
}
