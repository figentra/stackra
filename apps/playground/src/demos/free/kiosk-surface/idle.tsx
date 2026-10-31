/**
 * Stackra file contract:
 * Purpose: the "idle" demo of the web Kiosk surface: an attract screen that resets after 8 seconds with no touch, key or pointer;
 *          the count of resets is announced politely.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, KioskSurface, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { KIOSK_SURFACE_KEYS } from "#src/demos/free/kiosk-surface/kiosk-surface-keys.constant";

/** The demo's keys. */
const K = KIOSK_SURFACE_KEYS.kiosk_surface;

/** The idle timeout of the sample, in milliseconds; a real kiosk reads it from the device settings. */
// oxlint-disable-next-line stackra/no-literal-duration -- an idle timeout, not motion
const IDLE_MS = 8000;

/** Kiosk surface: Idle reset. */
export default function Idle() {
  const t = useCatalogueText(MESSAGES.en);
  const [resets, setResets] = useState(0);
  const [isStarted, setStarted] = useState(false);
  return (
    // The frame is a size container, so the surface fills it as it fills a kiosk screen.
    <section
      aria-label={t(K.area_idle)}
      className="h-80 w-80 max-w-full overflow-hidden rounded-[var(--radius-container)] border border-dashed border-border [container-type:size]"
    >
      <KioskSurface
        idleTimeoutMs={IDLE_MS}
        onIdle={() => {
          // The attract screen has nothing to reset; an order left alone goes back to it.
          if (!isStarted) return;
          setStarted(false);
          setResets((count) => count + 1);
        }}
      >
        <div className="grid justify-items-start gap-4 p-6">
          <Text>{t(isStarted ? K.basket : K.welcome, { count: 0 })}</Text>
          {isStarted ? null : <Button onPress={() => setStarted(true)}>{t(K.start)}</Button>}
          <Text type="small" tone="muted" aria-live="polite">
            {t(K.resets, { count: resets })}
          </Text>
        </div>
      </KioskSurface>
    </section>
  );
}
