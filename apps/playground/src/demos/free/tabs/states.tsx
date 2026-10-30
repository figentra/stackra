/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Tabs: one disabled tab, and a disabled list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0313.
 */
import { Tabs, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { tabsSections } from "#src/demos/free/tabs/tabs-sections.function";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demo's keys. */
const K = TABS_KEYS.tabs.states;

/** A disabled tab and a disabled list. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const sections = tabsSections(t);
  const oneDisabled = sections.map((section) =>
    section.id === "items" ? { ...section, isDisabled: true } : section,
  );
  return (
    <div className="flex flex-wrap items-start gap-8">
      <Tabs items={oneDisabled} label={t(K.disabled_tab)} />
      <Tabs items={sections} label={t(K.disabled_list)} isDisabled />
    </div>
  );
}
