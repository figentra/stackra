/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Reaction button: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { ReactionButton, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { REACTION_BUTTON_KEYS } from "#src/demos/free/reaction-button/reaction-button-keys.constant";

/** The demo's keys. */
const K = REACTION_BUTTON_KEYS.reaction_button.basics;

/** Reaction button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [liked, setLiked] = useState(false);
  return (
    <div className="flex flex-wrap items-baseline gap-1">
      <ReactionButton
        emoji="👍"
        label={t(K.thumbs)}
        count={12 + (liked ? 1 : 0)}
        isSelected={liked}
        onChange={setLiked}
      />
      <ReactionButton emoji="❤️" label={t(K.heart)} count={4} />
      <ReactionButton emoji="🎉" label={t(K.party)} count={1200} defaultSelected />
    </div>
  );
}
