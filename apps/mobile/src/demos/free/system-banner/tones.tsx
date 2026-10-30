/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native SystemBanner: a payments outage (danger), a trial ending (accent) and an
 *          e-invoicing deadline (warning), each dismissible.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 27.
 */
import { SystemBanner, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SYSTEM_BANNER_DEMO_KEYS } from "#src/demos/free/system-banner/system-banner-demo-keys.constant";

/** The demo's keys. */
const K = SYSTEM_BANNER_DEMO_KEYS.demo_free.system_banner;

/** One banner per tone. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <SystemBanner tone="danger" title={t(K.outage_title)} description={t(K.outage_detail)} />
      <SystemBanner title={t(K.trial_title)} description={t(K.trial_detail)} />
      <SystemBanner
        tone="warning"
        title={t(K.compliance_title)}
        description={t(K.compliance_detail)}
      />
    </View>
  );
}
