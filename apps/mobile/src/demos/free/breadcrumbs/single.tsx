/**
 * Stackra file contract:
 * Purpose: the "single" demo of the native Breadcrumbs: a trail of one step is only the current page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Breadcrumbs, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BREADCRUMBS_DEMO_KEYS } from "#src/demos/free/breadcrumbs/breadcrumbs-demo-keys.constant";

/** The demo's keys. */
const K = BREADCRUMBS_DEMO_KEYS.demo_free.breadcrumbs.single;

/** No link and no chevron. */
export default function Single() {
  const t = useCatalogueText(MESSAGES.en);
  return <Breadcrumbs items={[{ id: "home", label: t(K.home) }]} />;
}
