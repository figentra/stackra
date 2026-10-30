/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Icon button: Press the button to count; the loading one holds its press for a
 *          moment.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import { IconButton as UiIconButton, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_BUTTON_KEYS } from "#src/demos/free/icon-button/icon-button-keys.constant";

/** The demo's keys. */
const K = ICON_BUTTON_KEYS.icon_button;

/** How long the live sample stays loading, in milliseconds. */
const LOADING_MILLISECONDS = 1500;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Icon button: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOADING_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <UiIconButton
          label={t(K.count)}
          icon="settings"
          onPress={() => setCount((value) => value + 1)}
        />
        <output aria-live="polite" data-testid="press-count">
          <bdi>{t(K.presses, { count })}</bdi>
        </output>
      </div>
      <div className={ROW}>
        <UiIconButton
          variant="secondary"
          label={t(K.load)}
          icon="settings"
          isLoading={isLoading}
          onPress={() => setIsLoading(true)}
        />
        <Text role="status" tone="muted">
          <bdi>{t(K.load_state, { is_loading: isLoading })}</bdi>
        </Text>
      </div>
    </div>
  );
}
