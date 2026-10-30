/**
 * Stackra file contract:
 * Purpose: the "scroll" demo of the web PromptSuggestions: checkout questions on one line that scrolls sideways, as
 *          above a phone's message field.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { PromptSuggestions, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROMPT_SUGGESTIONS_KEYS } from "#src/demos/free/prompt-suggestions/prompt-suggestions-keys.constant";

/** The demo's keys. */
const K = PROMPT_SUGGESTIONS_KEYS.prompt_suggestions.scroll;

/** PromptSuggestions: Scrolling row. */
export default function Scroll() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-xs">
      <PromptSuggestions
        layout="scroll"
        suggestions={[
          { id: "pay", title: t(K.pay) },
          { id: "cod", title: t(K.cod) },
          { id: "exchange", title: t(K.exchange) },
          { id: "invoice", title: t(K.invoice) },
          { id: "hours", title: t(K.hours) },
        ]}
        onSelect={() => undefined}
      />
    </div>
  );
}
