/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web MessageActions: a shop assistant's answer about a delivery, with copy, retry,
 *          edit and the thumbs under it, and what happened written beside them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { MessageActions, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MESSAGE_ACTIONS_KEYS } from "#src/demos/free/message-actions/message-actions-keys.constant";

/** The demo's keys. */
const K = MESSAGE_ACTIONS_KEYS.message_actions.basics;

/** Copy, retry and edit actions under an answer, with the last action shown below. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [done, setDone] = useState("");
  return (
    <div className="grid w-full max-w-md gap-1">
      <Text>{t(K.answer)}</Text>
      <div className="flex items-center gap-2">
        <MessageActions
          copyValue={t(K.answer)}
          onRetry={() => setDone(t(K.retried))}
          onEdit={() => setDone(t(K.edited))}
          onFeedbackChange={() => undefined}
        />
        <Text tone="muted" type="small" role="status">
          {done}
        </Text>
      </div>
    </div>
  );
}
