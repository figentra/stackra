/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the web SystemBanner: the trial and e-invoicing notices with their next step, and the
 *          outage notice with a link to the status page and no dismiss, since it clears on its own.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 27; ADR 0060
 *          (light, dark, RTL).
 */
import { Button, Link, SystemBanner, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SYSTEM_BANNER_KEYS } from "#src/demos/free/system-banner/system-banner-keys.constant";

/** The demo's keys. */
const K = SYSTEM_BANNER_KEYS.system_banner;

/** System banner: With actions. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-3">
      <SystemBanner
        title={t(K.trial_title)}
        description={t(K.trial_detail)}
        actions={
          <Button size="sm" variant="primary">
            {t(K.choose_plan)}
          </Button>
        }
      />
      <SystemBanner
        tone="warning"
        title={t(K.compliance_title)}
        description={t(K.compliance_detail)}
        actions={
          <Button size="sm" variant="secondary">
            {t(K.link_vat)}
          </Button>
        }
      />
      <SystemBanner
        tone="danger"
        isDismissible={false}
        title={t(K.outage_title)}
        actions={<Link href="#status">{t(K.status_page)}</Link>}
      />
    </div>
  );
}
