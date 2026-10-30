/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Result: a submission that is pending, then fails or needs a review.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, Result, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RESULT_KEYS } from "#src/demos/free/result/result-keys.constant";

/** The demo's keys. */
const K = RESULT_KEYS.result.states;

/** Result: a submission that is pending, then fails or needs a review. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [status, setStatus] = useState<"pending" | "error" | "info">("pending");
  const words = {
    pending: [K.pending, K.pending_description],
    error: [K.error, K.error_description],
    info: [K.info, K.info_description],
  } as const;
  return (
    <div className="grid w-full gap-3">
      <Result
        status={status}
        title={t(words[status][0])}
        description={t(words[status][1])}
        actions={
          status === "pending" ? null : (
            <Button variant="secondary" onPress={() => setStatus("pending")}>
              {t(K.again)}
            </Button>
          )
        }
      />
      <div className="flex justify-center gap-2">
        <Button size="sm" variant="tertiary" onPress={() => setStatus("error")}>
          {t(K.show_error)}
        </Button>
        <Button size="sm" variant="tertiary" onPress={() => setStatus("info")}>
          {t(K.show_info)}
        </Button>
      </div>
    </div>
  );
}
