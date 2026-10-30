/**
 * Stackra file contract:
 * Purpose: the "shift" demo of the native AvatarGroup: who is on the morning shift, beside its heading.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 25.
 */
import { AvatarGroup, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_GROUP_DEMO_KEYS } from "#src/demos/free/avatar-group/avatar-group-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_GROUP_DEMO_KEYS.demo_free.avatar_group.shift;

/** Staff of a Riyadh branch (names are data, never translated). */
const STAFF = [
  { id: "1", name: "ليلى أحمد" },
  { id: "2", name: "Omar Khaled" },
  { id: "3", name: "Sara Nasser" },
  { id: "4", name: "يوسف العتيبي" },
  { id: "5", name: "Mona Saleh" },
  { id: "6", name: "Ada Lovelace" },
  { id: "7", name: "خالد الحربي" },
];

/** The shift's heading and its people. */
export default function Shift() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Text>{t(K.on_shift)}</Text>
        <Text type="small" tone="muted">
          {t(K.shift_morning)}
        </Text>
      </View>
      <AvatarGroup items={STAFF.slice(0, 5)} max={3} size="sm" label={t(K.on_shift)} />
    </View>
  );
}
