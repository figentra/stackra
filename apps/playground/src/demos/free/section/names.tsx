/**
 * Stackra file contract:
 * Purpose: the "names" demo of the web Section: A section is named by its title. Two sections with the same title are
 *          told apart by label, which names the region instead.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { Section as UiSection, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_KEYS } from "#src/demos/free/section/section-keys.constant";

/** The demo's keys. */
const K = SECTION_KEYS.section;

/** The grid that lays the samples out in one column. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** The Section demo: names. */
export default function Names() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={GRID}>
      <Sample caption={t(K.same_title)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <UiSection headingLevel={3} title={t(K.address)} label={t(K.billing_address)} />
          <UiSection headingLevel={3} title={t(K.address)} label={t(K.shipping_address)} />
        </div>
      </Sample>
    </ul>
  );
}
