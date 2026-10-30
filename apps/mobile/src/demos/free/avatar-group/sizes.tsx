/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native AvatarGroup: each size, and square avatars for branches.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 25.
 */
import { AvatarGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_GROUP_DEMO_KEYS } from "#src/demos/free/avatar-group/avatar-group-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_GROUP_DEMO_KEYS.demo_free.avatar_group.sizes;

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

/** Branches of one merchant (names are data). */
const BRANCHES = [
  { id: "ruh", name: "Riyadh Olaya" },
  { id: "jed", name: "جدة التحلية" },
  { id: "dmm", name: "Dammam Corniche" },
];

/** Each size, then the branches as squares. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Sample key={size} caption={t(K.size, { size })}>
          <AvatarGroup items={STAFF} size={size} label={t(K.assignees)} />
        </Sample>
      ))}
      <AvatarGroup
        items={BRANCHES}
        shape="square"
        tone="accent"
        variant="soft"
        label={t(K.branches)}
      />
    </View>
  );
}
