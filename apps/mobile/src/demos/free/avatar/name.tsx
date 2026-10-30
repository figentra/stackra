/**
 * Stackra file contract:
 * Purpose: the "name" demo of the native Avatar: a standalone avatar carries a `label`; in a list row it is decorative.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_DEMO_KEYS } from "#src/demos/free/avatar/avatar-demo-keys.constant";

/** The demo's keys. */
const K = AVATAR_DEMO_KEYS.demo_free.avatar.name;

/** The person beside the avatar: a name, not translated copy. */
const PERSON = "Ada Lovelace";

/** A labelled standalone avatar, and a decorative one beside the visible name. */
export default function Name() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-4">
      <Avatar name="Ada Lovelace" label="Ada Lovelace" size="lg" />
      <View className="flex-row items-center gap-3">
        <Avatar name="Ada Lovelace" />
        <View>
          <Text>{PERSON}</Text>
          <Text type="small" tone="muted">
            {t(K.role)}
          </Text>
        </View>
      </View>
    </View>
  );
}
