/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native PageHeader: a title with a line under it; the title is the page's heading.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { PageHeader, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_DEMO_KEYS } from "#src/demos/free/page-header/page-header-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_DEMO_KEYS.demo_free.page_header.basics;

/** Title and description. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return <PageHeader title={t(K.heading)} description={t(K.body)} />;
}
