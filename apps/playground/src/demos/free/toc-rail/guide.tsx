/**
 * Stackra file contract:
 * Purpose: the "guide" demo of the web TocRail: a setup guide.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { TocRail, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOC_RAIL_KEYS } from "#src/demos/free/toc-rail/toc-rail-keys.constant";

/** The demo's keys. */
const K = TOC_RAIL_KEYS.toc_rail;

/** The guide's sections. */
const SECTIONS = [
  ["setup", "setup_text", 2],
  ["menu", "menu_text", 2],
  ["modifiers", "modifiers_text", 3],
  ["payments", "payments_text", 2],
] as const;

/** Table of contents: the rail follows the section in view. */
export default function Guide() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full gap-6 sm:grid-cols-[1fr_12rem]">
      <div className="flex flex-col gap-6">
        {SECTIONS.map(([id, text]) => (
          <section key={id} className="flex min-h-32 flex-col gap-1">
            <h3 id={`toc-demo-${id}`} className="m-0 text-base font-semibold">
              {t(K[id])}
            </h3>
            <p className="m-0 text-sm text-muted">{t(K[text])}</p>
          </section>
        ))}
      </div>
      <TocRail
        className="sm:sticky sm:top-4 sm:self-start"
        label={t(K.label)}
        items={SECTIONS.map(([id, , level]) => ({ id: `toc-demo-${id}`, label: t(K[id]), level }))}
      />
    </div>
  );
}
