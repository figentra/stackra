/**
 * Stackra file contract:
 * Purpose: the "reach" demo of the web Kiosk surface: the seated reach (controls in the lower band, larger targets), high contrast
 *          on a switch, and each added item announced through `useKiosk`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, KioskSurface, Switch, Text, useCatalogueText, useKiosk } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { KIOSK_SURFACE_KEYS } from "#src/demos/free/kiosk-surface/kiosk-surface-keys.constant";

/** The demo's keys. */
const K = KIOSK_SURFACE_KEYS.kiosk_surface;

/** The basket inside the kiosk: adding announces the new count through the kiosk. */
function Basket() {
  const t = useCatalogueText(MESSAGES.en);
  const kiosk = useKiosk();
  const [count, setCount] = useState(0);
  return (
    <div className="grid gap-3 p-6">
      <Text>{t(K.basket, { count })}</Text>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onPress={() => {
            setCount(count + 1);
            kiosk?.announce(t(K.added, { count: count + 1 }));
          }}
        >
          {t(K.add)}
        </Button>
        <Button isDisabled={count === 0}>{t(K.pay)}</Button>
      </div>
    </div>
  );
}

/** Kiosk surface: Seated reach and announcements. */
export default function Reach() {
  const t = useCatalogueText(MESSAGES.en);
  const [isHighContrast, setHighContrast] = useState(false);
  return (
    <div className="grid gap-4">
      <Switch label={t(K.high_contrast)} value={isHighContrast} onChange={setHighContrast} />
      {/* The frame is a size container, so the surface fills it as it fills a kiosk screen. */}
      <section
        aria-label={t(K.area_reach)}
        className="h-80 w-80 max-w-full overflow-hidden rounded-[var(--radius-container)] border border-dashed border-border [container-type:size]"
      >
        <KioskSurface
          idleTimeoutMs={60_000}
          onIdle={() => undefined}
          reach="seated"
          isHighContrast={isHighContrast}
        >
          <Basket />
        </KioskSurface>
      </section>
    </div>
  );
}
