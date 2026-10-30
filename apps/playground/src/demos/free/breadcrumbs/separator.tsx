/**
 * Stackra file contract:
 * Purpose: the "separator" demo of the web Breadcrumbs: A slash instead of the chevron, passed through to HeroUI’s
 *          own `separator` prop.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.8.
 */
import { Breadcrumbs as UiBreadcrumbs, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { MESSAGES } from "#src/constants/messages.constant";
import { BREADCRUMBS_KEYS } from "#src/demos/free/breadcrumbs/breadcrumbs-keys.constant";

/** The demo's keys. */
const K = BREADCRUMBS_KEYS.breadcrumbs;

/** The Breadcrumbs demo: separator. */
export default function Separator() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  const anchor = (id: string) => `${here}#${id}`;

  return (
    <UiBreadcrumbs
      label={t(K.separator_label)}
      separator="/"
      items={[
        { id: "home", label: t(K.home), href: anchor("breadcrumbs-separator") },
        { id: "orders", label: t(K.orders), href: anchor("breadcrumbs-separator") },
        { id: "order", label: t(K.order) },
      ]}
    />
  );
}
