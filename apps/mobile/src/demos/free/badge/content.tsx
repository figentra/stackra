/**
 * Stackra file contract:
 * Purpose: the "content" demo of the native Badge: a number, a word and an icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Badge, Icon, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_DEMO_KEYS } from "#src/demos/free/badge/badge-demo-keys.constant";

/** The demo's keys. */
const K = BADGE_DEMO_KEYS.demo_free.badge.content;

/** What a badge can hold. */
export default function Content() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6 pt-2">
      <Badge.Anchor>
        <Avatar name="Ada Lovelace" shape="square" />
        <Badge tone="accent" label={t(K.number)}>
          {8}
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar name="Ada Lovelace" shape="square" />
        <Badge tone="success" variant="soft" label={t(K.word)}>
          {t(K.word_text)}
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar name="Ada Lovelace" shape="square" />
        <Badge tone="warning" label={t(K.icon_label)}>
          <Icon name="bell" size="sm" />
        </Badge>
      </Badge.Anchor>
    </View>
  );
}
