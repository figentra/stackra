/**
 * Stackra file contract:
 * Purpose: `ConsentPreferences`, the settings list of consent categories: one switch per category the configuration
 *          lists, with its label and hint; a required category shows locked on.
 * Boundary: reads and writes through `useConsent`; a change applies at once (the ledger stores it under the current
 *           policy version). Before the client has read the decision every optional switch shows off and read-only, so
 *           a server render never shows a choice. Labels are `consent::enums.consent_category.<code>`.
 * Runtime: browser
 * Governing contract: owner round 3 #29; ADR 0298 (decisions 1 to 3 and 6).
 */
import { useContainer } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Switch } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { ConsentConfig } from "#core/index";
import { useConsent } from "#react/index";

/**
 * The consent switches.
 *
 * @example
 * <Drawer isOpen={open} onOpenChange={setOpen}><ConsentPreferences /></Drawer>
 */
export function ConsentPreferences(): ReactElement {
  const consent = useConsent();
  const config = useContainer().get(ConsentConfig);
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t("consent::ui.preferences.title" as I18nKey)}>
      {config.categories.map((entry) => (
        <Switch
          key={entry.category}
          name={entry.category}
          label={t(`consent::enums.consent_category.${entry.category}` as I18nKey)}
          description={
            entry.descriptionKey === null ? undefined : t(entry.descriptionKey as I18nKey)
          }
          value={consent.isGranted(entry.category)}
          isReadOnly={entry.required || !consent.isLoaded}
          onChange={(granted) => consent.set(entry.category, granted)}
        />
      ))}
    </div>
  );
}
