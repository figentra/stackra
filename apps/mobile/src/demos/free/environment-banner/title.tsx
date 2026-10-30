/**
 * Stackra file contract:
 * Purpose: the "title" demo of the native EnvironmentBanner: `isProduction` hides it; switch it to see production.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, EnvironmentBanner, Switch, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ENVIRONMENT_BANNER_DEMO_KEYS } from "#src/demos/free/environment-banner/environment-banner-demo-keys.constant";

/** The demo's keys. */
const K = ENVIRONMENT_BANNER_DEMO_KEYS.demo_free.environment_banner.title;

/** A sandbox banner with what it means and an action. */
export default function Title() {
  const [isProduction, setIsProduction] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Switch label={t(K.production)} value={isProduction} onChange={setIsProduction} />
      <EnvironmentBanner
        environment={t(K.environment)}
        isProduction={isProduction}
        description={t(K.meaning)}
        actions={<Button size="sm">{t(K.publish)}</Button>}
      />
    </View>
  );
}
