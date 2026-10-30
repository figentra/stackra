/**
 * Stackra file contract:
 * Purpose: the "new-count" demo of the web MessageScroller: courier updates arrive while you read further up, and the
 *          jump button says how many are waiting below.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, MessageScroller, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MESSAGE_SCROLLER_KEYS } from "#src/demos/free/message-scroller/message-scroller-keys.constant";

/** The demo's keys. */
const K = MESSAGE_SCROLLER_KEYS.message_scroller.new_count;

/** MessageScroller: New message count. */
export default function NewCount() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(8);
  return (
    <div className="grid w-full max-w-md gap-3">
      <MessageScroller className="h-56 border border-border bg-surface p-3">
        {Array.from({ length: count }, (_, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- reason: the demo's messages only ever grow at the end
          <Text key={index} className="py-2">
            {t(index < 8 ? K.first : K.incoming)}
          </Text>
        ))}
      </MessageScroller>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onPress={() => setCount(count + 1)}>
          {t(K.receive)}
        </Button>
        <Text tone="muted" type="small">
          {t(K.hint)}
        </Text>
      </div>
    </div>
  );
}
