/**
 * Stackra file contract:
 * Purpose: the "demo" demo of the web Environment banner: a sandbox banner with a description and an action, and a
 *          switch that shows it as production, where it draws nothing.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL).
 */
import { Button, EnvironmentBanner, Switch, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ENVIRONMENT_BANNER_KEYS } from "#src/demos/free/environment-banner/environment-banner-keys.constant";

/** The demo's keys. */
const K = ENVIRONMENT_BANNER_KEYS.environment_banner;

/** Environment banner: Sandbox. */
export default function Demo() {
  const t = useCatalogueText(MESSAGES.en);
  const [isProduction, setIsProduction] = useState(false);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Switch label={t(K.production)} value={isProduction} onChange={setIsProduction} />
      <EnvironmentBanner
        environment={t(K.environment)}
        isProduction={isProduction}
        description={t(K.description)}
        actions={<Button size="sm">{t(K.publish)}</Button>}
      />
    </div>
  );
}
