/**
 * Stackra file contract:
 * Purpose: the "chips" demo of the web PromptSuggestions: follow-up questions after an answer, as compact chips that
 *          wrap onto more lines.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { PromptSuggestions, useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROMPT_SUGGESTIONS_KEYS } from "#src/demos/free/prompt-suggestions/prompt-suggestions-keys.constant";

/** The demo's keys. */
const K = PROMPT_SUGGESTIONS_KEYS.prompt_suggestions.chips;

/** Short suggestions as a row of chips, one with an icon. */
export default function Chips() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-md">
      <PromptSuggestions
        suggestions={[
          { id: "refund", title: t(K.refund) },
          { id: "address", title: t(K.address) },
          { id: "gift", title: t(K.gift) },
          { id: "agent", title: t(K.agent), icon: Icons.LifeBuoy },
        ]}
        onSelect={() => undefined}
      />
    </div>
  );
}
