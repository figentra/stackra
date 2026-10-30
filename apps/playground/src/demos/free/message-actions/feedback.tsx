/**
 * Stackra file contract:
 * Purpose: the "feedback" demo of the web MessageActions: an answer about abaya sizes rated with the thumbs, the
 *          rating held by the page and thanked for under the answer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { MessageActions, Text, useCatalogueText } from "@stackra/ui/react";
import type { MessageFeedback } from "@stackra/ui/contracts";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MESSAGE_ACTIONS_KEYS } from "#src/demos/free/message-actions/message-actions-keys.constant";

/** The demo's keys. */
const K = MESSAGE_ACTIONS_KEYS.message_actions.feedback;

/** Thumbs up or down on an answer, with a thank-you line for each choice. */
export default function Feedback() {
  const t = useCatalogueText(MESSAGES.en);
  const [feedback, setFeedback] = useState<MessageFeedback | null>(null);
  const thanks = feedback === "up" ? K.thanks_up : feedback === "down" ? K.thanks_down : K.none;
  return (
    <div className="grid w-full max-w-md gap-1">
      <Text>{t(K.answer)}</Text>
      <div className="flex items-center gap-2">
        <MessageActions
          copyValue={t(K.answer)}
          feedback={feedback}
          onFeedbackChange={setFeedback}
        />
        <Text tone="muted" type="small" role="status">
          {t(thanks)}
        </Text>
      </div>
    </div>
  );
}
