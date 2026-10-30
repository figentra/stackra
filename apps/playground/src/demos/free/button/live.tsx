/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Button: a save that loads for a moment and a press counter beside a disabled twin.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0303 (decision 7).
 */
import { Button, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_KEYS } from "#src/routes/button/button-keys.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.live;

/** How long the save stays loading, in milliseconds. */
const SAVE_MILLISECONDS = 1500;

/** A loading save and a press counter. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isSaving, setIsSaving] = useState(false);
  const [count, setCount] = useState(0);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isSaving) return undefined;
    const timer = setTimeout(() => setIsSaving(false), SAVE_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isSaving]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button isLoading={isSaving} onPress={() => setIsSaving(true)}>
          {t(K.save)}
        </Button>
        <output aria-live="polite" data-testid="save-state">
          <bdi>{t(isSaving ? K.saving : K.idle)}</bdi>
        </output>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button onPress={() => setCount((value) => value + 1)}>{t(K.count)}</Button>
        <Button isDisabled onPress={() => setCount((value) => value + 1)}>
          {t(K.count_disabled)}
        </Button>
        <output aria-live="polite" data-testid="press-count">
          <bdi>{t(K.presses, { count })}</bdi>
        </output>
      </div>
    </div>
  );
}
