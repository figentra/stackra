/**
 * Stackra file contract:
 * Purpose: the section tabs of a component page below the `lg` breakpoint, in place of the rail: a scrollable
 *          `Tabs` row (Overview · Examples · Styling · API · A11y · Stackra), scroll-spied over the page's section
 *          anchors; picking a tab scrolls to its section. The tabs carry no panels: the page is one document.
 * Boundary: navigation only; the anchors are set by the component page kit.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.2 and 4; WAI-ARIA 1.2 tabs pattern.
 */
import type { ComponentSection } from "@stackra/showcase";
import { Tabs, useCatalogueText } from "@stackra/ui/react";

import { scrollToSection } from "#src/components/toc-rail/scroll-to-section.function";
import { useActiveSection } from "#src/components/toc-rail/use-active-section";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { SectionTabsProps } from "#src/components/section-tabs/section-tabs.props";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** Each tab and the section it starts at, in page order; the sections between two tabs belong to the first. */
const TABS = [
  ["overview", "import"],
  ["examples", "examples"],
  ["styling", "styling"],
  ["api", "api"],
  ["a11y", "accessibility"],
  ["stackra", "stackra"],
] as const satisfies readonly (readonly [keyof typeof K.section_tab, ComponentSection])[];

/** The order of the spied anchors. */
const ANCHORS = TABS.map(([, section]) => section);

/** The narrow-screen section tabs. */
export function SectionTabs({ className }: SectionTabsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const active = useActiveSection(ANCHORS);
  const selected = TABS.find(([, section]) => section === active)?.[0] ?? TABS[0][0];
  return (
    <div className={className}>
      <Tabs
        label={t(K.ui.on_this_page)}
        variant="secondary"
        items={TABS.map(([id]) => ({ id, label: t(K.section_tab[id]), content: null }))}
        selectedKeys={[selected]}
        onSelectionChange={([id]) => {
          const section = TABS.find(([tab]) => tab === id)?.[1];
          if (section) scrollToSection(section);
        }}
      />
    </div>
  );
}
