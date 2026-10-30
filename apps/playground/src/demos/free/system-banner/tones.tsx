/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web SystemBanner: a payments outage (danger), a trial ending (accent) and an
 *          e-invoicing deadline (warning), each app-wide and dismissible.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 27; ADR 0060
 *          (light, dark, RTL).
 */
import { SystemBanner, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SYSTEM_BANNER_KEYS } from "#src/demos/free/system-banner/system-banner-keys.constant";

/** The demo's keys. */
const K = SYSTEM_BANNER_KEYS.system_banner;

/** System banner: Tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-3">
      <SystemBanner tone="danger" title={t(K.outage_title)} description={t(K.outage_detail)} />
      <SystemBanner title={t(K.trial_title)} description={t(K.trial_detail)} />
      <SystemBanner
        tone="warning"
        title={t(K.compliance_title)}
        description={t(K.compliance_detail)}
      />
    </div>
  );
}
