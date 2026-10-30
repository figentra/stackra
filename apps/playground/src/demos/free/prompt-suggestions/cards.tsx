/**
 * Stackra file contract:
 * Purpose: the "cards" demo of the web PromptSuggestions: a shop assistant's first questions as cards with an icon and
 *          a line, and the prompt sent written under them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { PromptSuggestions, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROMPT_SUGGESTIONS_KEYS } from "#src/demos/free/prompt-suggestions/prompt-suggestions-keys.constant";

/** The demo's keys. */
const K = PROMPT_SUGGESTIONS_KEYS.prompt_suggestions.cards;

/** Suggestion cards with a title, a line and an icon; choosing one shows its prompt. */
export default function Cards() {
  const t = useCatalogueText(MESSAGES.en);
  const [sent, setSent] = useState("");
  return (
    <div className="grid w-full gap-3">
      <PromptSuggestions
        suggestions={[
          { id: "track", title: t(K.track), description: t(K.track_line), icon: Icons.Truck },
          {
            id: "return",
            title: t(K.return),
            description: t(K.return_line),
            icon: Icons.RotateCcw,
          },
          { id: "size", title: t(K.size), description: t(K.size_line), icon: Icons.ShoppingBag },
        ]}
        onSelect={(suggestion) =>
          setSent(t(K.chosen, { prompt: suggestion.prompt ?? suggestion.title }))
        }
      />
      <Text tone="muted" type="small" role="status">
        {sent}
      </Text>
    </div>
  );
}
