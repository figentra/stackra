/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Language switcher: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { LocaleSwitcher, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { LOCALE_SWITCHER_KEYS } from "#src/demos/free/locale-switcher/locale-switcher-keys.constant";

/** The demo's keys. */
const K = LOCALE_SWITCHER_KEYS.locale_switcher.basics;

/** Language switcher: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [locale, setLocale] = useState("ar");
  return (
    <div className="grid gap-4">
      <LocaleSwitcher
        label={t(K.label)}
        locales={["ar", "en", "fr"]}
        value={locale}
        onChange={setLocale}
      />
      <Text tone="muted">{t(K.chosen, { locale })}</Text>
    </div>
  );
}
