/**
 * Stackra file contract:
 * Purpose: the "trail" demo of the web Breadcrumbs: Three steps. The last is the current page: it is text, announced
 *          as the current page, and has no link.
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

/** Breadcrumbs: Trail. */
export default function Trail() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  const anchor = (id: string) => `${here}#${id}`;

  return (
    <UiBreadcrumbs
      label={t(K.trail_label)}
      items={[
        { id: "home", label: t(K.home), href: anchor("breadcrumbs-trail") },
        { id: "orders", label: t(K.orders), href: anchor("breadcrumbs-trail") },
        { id: "order", label: t(K.order) },
      ]}
    />
  );
}
