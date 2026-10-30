/**
 * Stackra file contract:
 * Purpose: the "dismiss" demo of the web SystemBanner: dismissing collapses the banner, then the page notes it; the
 *          button below brings it back, as an app would after its next notice.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 27; ADR 0060
 *          (light, dark, RTL).
 */
import { Button, SystemBanner, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SYSTEM_BANNER_KEYS } from "#src/demos/free/system-banner/system-banner-keys.constant";

/** The demo's keys. */
const K = SYSTEM_BANNER_KEYS.system_banner;

/** System banner: Dismiss. */
export default function Dismiss() {
  const t = useCatalogueText(MESSAGES.en);
  const [isDismissed, setDismissed] = useState(false);
  return (
    <div className="grid gap-3">
      {isDismissed ? (
        <>
          <Text tone="muted" aria-live="polite">
            {t(K.dismissed)}
          </Text>
          <Button variant="secondary" onPress={() => setDismissed(false)}>
            {t(K.show_again)}
          </Button>
        </>
      ) : (
        <SystemBanner
          tone="danger"
          title={t(K.outage_title)}
          description={t(K.outage_detail)}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </div>
  );
}
