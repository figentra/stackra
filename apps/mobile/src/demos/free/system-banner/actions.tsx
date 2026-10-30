/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native SystemBanner: the trial and e-invoicing notices with their next step, and
 *          the outage notice with a status button and no dismiss, since it clears on its own.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 27.
 */
import { Button, SystemBanner, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SYSTEM_BANNER_DEMO_KEYS } from "#src/demos/free/system-banner/system-banner-demo-keys.constant";

/** The demo's keys. */
const K = SYSTEM_BANNER_DEMO_KEYS.demo_free.system_banner;

/** Banners with a next step. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <SystemBanner
        title={t(K.trial_title)}
        description={t(K.trial_detail)}
        actions={<Button size="sm">{t(K.choose_plan)}</Button>}
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
        actions={
          <Button size="sm" variant="ghost">
            {t(K.status_page)}
          </Button>
        }
      />
    </View>
  );
}
