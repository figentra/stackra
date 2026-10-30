/**
 * Stackra file contract:
 * Purpose: the "trail" demo of the native PageHeader: `breadcrumbs` above the title and a `status` beside it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { BreadcrumbItem } from "@stackra/ui/contracts";
import { PageHeader, StatusBadge, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_DEMO_KEYS } from "#src/demos/free/page-header/page-header-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_DEMO_KEYS.demo_free.page_header.trail;

/** An order page under Home and Orders, marked paid. */
export default function Trail() {
  const t = useCatalogueText(MESSAGES.en);
  // The earlier steps press nothing: the demo has no router.
  const trail: readonly BreadcrumbItem[] = [
    { id: "home", label: t(K.home), onPress: () => undefined },
    { id: "orders", label: t(K.orders), onPress: () => undefined },
    { id: "order", label: t(K.heading) },
  ];
  return (
    <PageHeader
      title={t(K.heading)}
      description={t(K.body)}
      breadcrumbs={trail}
      status={<StatusBadge tone="success">{t(K.status)}</StatusBadge>}
    />
  );
}
