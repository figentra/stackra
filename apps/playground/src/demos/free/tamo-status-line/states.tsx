/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web tamo-status-line: the working line with Stop and the error line with Try again.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { TamoStatusLine, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_STATUS_LINE_KEYS } from "#src/demos/free/tamo-status-line/tamo-status-line-keys.constant";

/** The demo's keys. */
const K = TAMO_STATUS_LINE_KEYS.tamo_status_line;

/** Tamo status: states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [said, setSaid] = useState("");
  return (
    <div className="grid max-w-md gap-3">
      <TamoStatusLine status="working" onStop={() => setSaid(t(K.stopped))} />
      <TamoStatusLine status="error" onRetry={() => setSaid(t(K.retried))} />
      <Text type="small" tone="muted">
        {said}
      </Text>
    </div>
  );
}
