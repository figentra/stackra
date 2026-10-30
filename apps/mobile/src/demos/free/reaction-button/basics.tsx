/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Reaction button: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { ReactionButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { REACTION_BUTTON_DEMO_KEYS } from "#src/demos/free/reaction-button/reaction-button-demo-keys.constant";

/** The demo's keys. */
const K = REACTION_BUTTON_DEMO_KEYS.demo_free.reaction_button.basics;

/** Reaction button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [liked, setLiked] = useState(false);
  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <ReactionButton
        emoji="👍"
        label={t(K.thumbs)}
        count={12 + (liked ? 1 : 0)}
        isSelected={liked}
        onChange={setLiked}
      />
      <ReactionButton emoji="❤️" label={t(K.heart)} count={4} />
      <ReactionButton emoji="🎉" label={t(K.party)} count={1200} defaultSelected />
    </View>
  );
}
