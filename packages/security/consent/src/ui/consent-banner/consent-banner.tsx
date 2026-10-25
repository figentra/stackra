/**
 * Stackra file contract:
 * Purpose: `ConsentBanner`, the cookie and storage banner every web surface shows until the visitor has decided on
 *          each optional category the configuration lists: accept all, refuse all (equal weight), manage, and a link
 *          to the cookie policy.
 * Boundary: reads and writes through `useConsent`; it decides nothing itself. It renders nothing in a server render or
 *           before the client has read the stored decision, and nothing once every optional category is decided or
 *           when none is configured. Under Global Privacy Control the ledger already refuses, so nothing is undecided
 *           to ask about. Texts are `consent::ui.banner.*`; the look is `@stackra/ui`'s.
 * Runtime: browser
 * Governing contract: owner round 3 #29 (cookie banner UI in @stackra/consent); ADR 0298 (decisions 1 to 4 and 6);
 *                     release must-haves (cookie banner).
 */
import { useContainer } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Button, Card, Heading, Link, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { ConsentConfig, ConsentStatus } from "#core/index";
import { useConsent } from "#react/index";
import type { ConsentBannerProps } from "#ui/consent-banner/consent-banner-props.type";

/**
 * The cookie banner.
 *
 * @example
 * <ConsentBanner policyHref="/legal/cookies" onManage={() => setPreferencesOpen(true)} />
 */
export function ConsentBanner({ policyHref, onManage }: ConsentBannerProps): ReactElement | null {
  const consent = useConsent();
  const config = useContainer().get(ConsentConfig);
  const { t } = useTranslation();
  const optional = config.categories.filter((entry) => !entry.required);
  const undecided = optional.some(
    (entry) => consent.status(entry.category) === ConsentStatus.Undecided,
  );
  if (!consent.isLoaded || !undecided) return null;
  const decideAll = (granted: boolean) => {
    for (const entry of optional) consent.set(entry.category, granted);
  };
  return (
    <section role="region" aria-label={t("consent::ui.banner.title" as I18nKey)}>
      <Card>
        <Card.Content>
          <Heading level={2}>{t("consent::ui.banner.title" as I18nKey)}</Heading>
          <Text>{t("consent::ui.banner.body" as I18nKey)}</Text>
          {policyHref === undefined ? null : (
            <Link href={policyHref}>{t("consent::ui.banner.policy" as I18nKey)}</Link>
          )}
        </Card.Content>
        <Card.Footer>
          <Button variant="primary" onPress={() => decideAll(true)}>
            {t("consent::ui.banner.accept_all" as I18nKey)}
          </Button>
          <Button variant="primary" onPress={() => decideAll(false)}>
            {t("consent::ui.banner.reject_all" as I18nKey)}
          </Button>
          {onManage === undefined ? null : (
            <Button variant="tertiary" onPress={onManage}>
              {t("consent::ui.banner.manage" as I18nKey)}
            </Button>
          )}
        </Card.Footer>
      </Card>
    </section>
  );
}
