/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web FeatureSection block (@stackra/experience): six features of a shop platform in a three-column grid.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0503 (module UI kits).
 */
import { FeatureSection } from "@stackra/experience/react";
import { useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { FEATURE_SECTION_KEYS } from "#src/demos/free/feature-section/feature-section-keys.constant";

/** The demo's keys. */
const K = FEATURE_SECTION_KEYS.feature_section.basics;

/** Feature section: six features. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <FeatureSection
      eyebrow={t(K.eyebrow)}
      title={t(K.title)}
      description={t(K.description)}
      features={[
        {
          id: "payments",
          title: t(K.payments),
          description: t(K.payments_line),
          icon: Icons.CreditCard,
        },
        {
          id: "shipping",
          title: t(K.shipping),
          description: t(K.shipping_line),
          icon: Icons.Truck,
        },
        {
          id: Icons.Languages,
          title: t(K.languages),
          description: t(K.languages_line),
          icon: Icons.Languages,
        },
        {
          id: "insights",
          title: t(K.insights),
          description: t(K.insights_line),
          icon: Icons.ChartBar,
        },
        {
          id: "security",
          title: t(K.security),
          description: t(K.security_line),
          icon: Icons.ShieldCheck,
        },
        {
          id: "support",
          title: t(K.support),
          description: t(K.support_line),
          icon: Icons.Headphones,
        },
      ]}
    />
  );
}
