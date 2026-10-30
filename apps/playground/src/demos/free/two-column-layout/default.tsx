/**
 * Stackra file contract:
 * Purpose: the "default" demo of the web Two column layout: The default collapse breakpoint is lg: from 1024 px the
 *          side column is beside the main one, below that it is under it. Resize the window to see both.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 1 and 6); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.3.2,
 *          1.4.10 and 4.1.3.
 */
import {
  Section,
  Text,
  TwoColumnLayout as UiTwoColumnLayout,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TWO_COLUMN_LAYOUT_KEYS } from "#src/demos/free/two-column-layout/two-column-layout-keys.constant";

/** The demo's keys. */
const K = TWO_COLUMN_LAYOUT_KEYS.two_column_layout;

/** The box a layout sits in, so its edges show. */
const BOX = "border border-border p-4";

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
    <div className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={BOX} data-sample={sample}>
        {children}
      </div>
    </div>
  );
}

/** Two column layout: Default. */
export default function Default() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={t(K.default_caption)} sample="default">
      <UiTwoColumnLayout
        aside={
          <>
            <Section headingLevel={3} title={t(K.summary)}>
              <Text>{t(K.summary_body)}</Text>
            </Section>
            <Section headingLevel={3} title={t(K.history)}>
              <Text>{t(K.history_body)}</Text>
            </Section>
          </>
        }
      >
        <Section headingLevel={3} title={t(K.order)}>
          <Text>{t(K.order_body)}</Text>
        </Section>
        <Section headingLevel={3} title={t(K.items)}>
          <Text>{t(K.items_body)}</Text>
        </Section>
      </UiTwoColumnLayout>
    </Sample>
  );
}
