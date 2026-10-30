/**
 * Stackra file contract:
 * Purpose: the "payment" demo of the web InlineLoading: charging a card at the till turns the spinner into a check ("Paid") or an alert ("Card declined"), announced as it changes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 28.
 */
import type { InlineLoadingStatus } from "@stackra/ui/contracts";
import {
  Button,
  InlineLoading as UiInlineLoading,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_LOADING_KEYS } from "#src/demos/free/inline-loading/inline-loading-keys.constant";

/** The demo's keys. */
const K = INLINE_LOADING_KEYS.inline_loading;

/** How long the fake charge takes. */
const DELAY = 1200;

/** InlineLoading: Card payment. */
export default function Payment() {
  const t = useCatalogueText(MESSAGES.en);
  const [status, setStatus] = useState<InlineLoadingStatus>("idle");
  const declinesNext = useRef(false);

  const charge = () => {
    setStatus("loading");
    setTimeout(() => {
      setStatus(declinesNext.current ? "error" : "success");
      declinesNext.current = false;
    }, DELAY);
  };

  return (
    <div className="grid gap-3">
      <Text className="font-medium">{t(K.total)}</Text>
      <div className="flex flex-wrap items-center gap-3">
        <Button isDisabled={status === "loading"} onPress={charge}>
          {t(K.charge)}
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            declinesNext.current = true;
          }}
        >
          {t(K.decline_next)}
        </Button>
        <UiInlineLoading
          status={status}
          loadingLabel={t(K.charging)}
          successLabel={t(K.paid)}
          errorLabel={t(K.declined)}
        />
      </div>
    </div>
  );
}
