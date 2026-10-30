/**
 * Stackra file contract:
 * Purpose: the "action" demo of the web Spinner: Press the button: a labelled spinner shows for a moment, then its
 *          result is announced.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Button, Spinner as UiSpinner, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_KEYS } from "#src/demos/free/spinner/spinner-keys.constant";

/** The demo's keys. */
const K = SPINNER_KEYS.spinner;

/** How long the start-and-stop example waits, in milliseconds. */
const WAIT_MS = 1500;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** Spinner: Start and stop. */
export default function Action() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setIsLoading] = useState(false);

  const [result, setResult] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The timer is cleared on unmount, so a page left mid-wait never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    setIsLoading(true);
    setResult("");
    timer.current = setTimeout(() => {
      setIsLoading(false);
      setResult(t(K.loaded));
    }, WAIT_MS);
  };

  return (
    <div className={ROW}>
      <Button variant="secondary" isLoading={isLoading} onPress={start}>
        {t(K.load)}
      </Button>
      {isLoading ? <UiSpinner label={t(K.loading)} /> : null}
      <output aria-live="polite">{result}</output>
    </div>
  );
}
