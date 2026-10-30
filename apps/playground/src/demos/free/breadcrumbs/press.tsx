/**
 * Stackra file contract:
 * Purpose: the "press" demo of the web Breadcrumbs: Steps with a handler and no href are press-only links: the page
 *          counts the presses.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.8.
 */
import { Breadcrumbs as UiBreadcrumbs, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BREADCRUMBS_KEYS } from "#src/demos/free/breadcrumbs/breadcrumbs-keys.constant";

/** The demo's keys. */
const K = BREADCRUMBS_KEYS.breadcrumbs;

/** Breadcrumbs: Press only. */
export default function Press() {
  const t = useCatalogueText(MESSAGES.en);
  const [presses, setPresses] = useState(0);

  return (
    <div className="grid gap-6">
      <UiBreadcrumbs
        label={t(K.press_only_label)}
        items={[
          { id: "home", label: t(K.home), onPress: () => setPresses((count) => count + 1) },
          {
            id: "orders",
            label: t(K.orders),
            onPress: () => setPresses((count) => count + 1),
          },
          { id: "order", label: t(K.order) },
        ]}
      />
      <output aria-live="polite" data-testid="press-count">
        <bdi>{t(K.press_count, { count: presses })}</bdi>
      </output>
    </div>
  );
}
