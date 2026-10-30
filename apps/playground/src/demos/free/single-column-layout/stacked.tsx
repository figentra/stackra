/**
 * Stackra file contract:
 * Purpose: the "stacked" demo of the web Single column layout: Each child is one block of the page. The layout only
 *          spaces them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decision 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10 and
 *          4.1.3.
 */
import {
  Section,
  SingleColumnLayout as UiSingleColumnLayout,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SINGLE_COLUMN_LAYOUT_KEYS } from "#src/demos/free/single-column-layout/single-column-layout-keys.constant";

/** The demo's keys. */
const K = SINGLE_COLUMN_LAYOUT_KEYS.single_column_layout;

/** The box a layout sits in, so its edges show. */
// `min-w-0` on every grid item between the page and the layout: a grid item grows to its content's min-content
// otherwise, and the wide sample would widen the page instead of scrolling inside the column.
const BOX = "min-w-0 border border-border p-4";

/** A caption above the box a layout sits in. */
function Sample({
  caption,
  children,
  sample,
}: {
  readonly caption: string;
  readonly children: ReactNode;
  readonly sample: string;
}) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={BOX} data-sample={sample}>
        {children}
      </div>
    </div>
  );
}

/** Single column layout: Stacked sections. */
export default function Stacked() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={t(K.stacked_caption)} sample="stacked">
      <UiSingleColumnLayout>
        <Section headingLevel={3} title={t(K.customer)}>
          <Text>{t(K.customer_body)}</Text>
        </Section>
        <Section headingLevel={3} title={t(K.payment)}>
          <Text>{t(K.payment_body)}</Text>
        </Section>
        <Section headingLevel={3} title={t(K.shipping)}>
          <Text>{t(K.shipping_body)}</Text>
        </Section>
      </UiSingleColumnLayout>
    </Sample>
  );
}
