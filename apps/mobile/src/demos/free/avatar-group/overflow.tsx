/**
 * Stackra file contract:
 * Purpose: the "overflow" demo of the native AvatarGroup: seven assignees, four shown and a count; press to fan out.
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
const K = AVATAR_GROUP_DEMO_KEYS.demo_free.avatar_group.overflow;

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

/** Four of seven, then two of seven in the accent tone. */
export default function Overflow() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-4">
      <AvatarGroup items={STAFF} label={t(K.assignees)} />
      <AvatarGroup items={STAFF} max={2} tone="accent" variant="soft" label={t(K.assignees)} />
      <Text type="caption" tone="muted">
        {t(K.hint)}
      </Text>
    </View>
  );
}
