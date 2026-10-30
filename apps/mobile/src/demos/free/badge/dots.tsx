/**
 * Stackra file contract:
 * Purpose: the "dots" demo of the native Badge: small presence dots at the bottom end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Avatar, Badge, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_DEMO_KEYS } from "#src/demos/free/badge/badge-demo-keys.constant";

/** The demo's keys. */
const K = BADGE_DEMO_KEYS.demo_free.badge.dots;

/** The presence states, each a tone. */
const PRESENCE = [
  ["success", "online"],
  ["warning", "away"],
  ["danger", "busy"],
] as const;

/** Online, away and busy. */
export default function Dots() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6">
      {PRESENCE.map(([tone, state]) => (
        <Sample key={tone} caption={t(K[state])}>
          <Badge.Anchor>
            <Avatar name="Ada Lovelace" />
            <Badge tone={tone} size="sm" placement="bottom-end" label={t(K[state])} />
          </Badge.Anchor>
        </Sample>
      ))}
    </View>
  );
}
