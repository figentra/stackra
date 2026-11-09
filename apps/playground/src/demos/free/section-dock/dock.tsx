/**
 * Stackra file contract:
 * Purpose: the "dock" demo of the web SectionDock: a short billing page of four sections scrolled in its own box, with
 *          the dock on its bottom edge linking to each section and narrating the current one in its status line.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The section ids
 *           come from `useId`, because the page draws a demo more than once (its section, the hero, the RTL panel).
 *           The dock follows the section in view through the viewport, so inside this box it is a sketch of a page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0501 (section 9, the blueprint roles); STA-2041.
 */
import { Heading, SectionDock, Text, useCatalogueText } from "@stackra/ui/react";
import { useId } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_DOCK_KEYS } from "#src/demos/free/section-dock/section-dock-keys.constant";

/** The demo's keys. */
const K = SECTION_DOCK_KEYS.section_dock;

/** The page's sections in reading order. */
const SECTIONS = [
  { key: "plans", label: K.plans, text: K.plans_text, status: K.plans_status },
  { key: "trials", label: K.trials, text: K.trials_text, status: K.trials_status },
  { key: "usage", label: K.usage, text: K.usage_text, status: K.usage_status },
  { key: "dunning", label: K.dunning, text: K.dunning_text, status: K.dunning_status },
] as const;

/** SectionDock: dock. */
export default function Dock() {
  const t = useCatalogueText(MESSAGES.en);
  const id = useId();
  const sections = SECTIONS.map((section) => ({
    id: `${id}-${section.key}`,
    label: t(section.label),
    status: t(section.status),
    text: t(section.text),
  }));
  return (
    <div className="relative h-80 w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-background">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="grid min-h-56 content-start gap-2 p-6">
          <Heading level={3}>{section.label}</Heading>
          <Text tone="muted">{section.text}</Text>
        </section>
      ))}
      <SectionDock
        label={t(K.label)}
        items={sections.map(({ id: sectionId, label, status }) => ({
          id: sectionId,
          label,
          status,
        }))}
      />
    </div>
  );
}
