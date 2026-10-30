/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Single column layout: Add and remove sections: the layout keeps one column and
 *          the same gap.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decision 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10 and
 *          4.1.3.
 */
import {
  Button,
  Section,
  SingleColumnLayout as UiSingleColumnLayout,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SINGLE_COLUMN_LAYOUT_KEYS } from "#src/demos/free/single-column-layout/single-column-layout-keys.constant";

/** The demo's keys. */
const K = SINGLE_COLUMN_LAYOUT_KEYS.single_column_layout;

/** The box a layout sits in, so its edges show. */
// `min-w-0` on every grid item between the page and the layout: a grid item grows to its content's min-content
// otherwise, and the wide sample would widen the page instead of scrolling inside the column.
const BOX = "min-w-0 border border-border p-4";

/** Single column layout: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(2);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onPress={() => setCount((current) => current + 1)}>
          {t(K.add)}
        </Button>
        <Button
          variant="secondary"
          isDisabled={count === 0}
          onPress={() => setCount((current) => Math.max(0, current - 1))}
        >
          {t(K.remove)}
        </Button>
      </div>
      <div className={BOX} data-sample="live">
        <UiSingleColumnLayout>
          {Array.from({ length: count }, (_, index) => (
            <Section key={index} headingLevel={3} title={t(K.note, { index: index + 1 })}>
              <Text>{t(K.note_body)}</Text>
            </Section>
          ))}
        </UiSingleColumnLayout>
      </div>
      <Text role="status" tone="muted" data-sample="live-status">
        {t(K.count, { count })}
      </Text>
    </div>
  );
}
