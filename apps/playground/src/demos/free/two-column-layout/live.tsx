/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Two column layout: The switch adds a history section to the side column. The
 *          main column does not move.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 1 and 6); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.3.2,
 *          1.4.10 and 4.1.3.
 */
import {
  Section,
  Switch,
  Text,
  TwoColumnLayout as UiTwoColumnLayout,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TWO_COLUMN_LAYOUT_KEYS } from "#src/demos/free/two-column-layout/two-column-layout-keys.constant";

/** The demo's keys. */
const K = TWO_COLUMN_LAYOUT_KEYS.two_column_layout;

/** The box a layout sits in, so its edges show. */
const BOX = "border border-border p-4";

/** Two column layout: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isHistoryShown, setIsHistoryShown] = useState(false);

  return (
    <div className="grid gap-3">
      <Switch label={t(K.history_switch)} value={isHistoryShown} onChange={setIsHistoryShown} />
      <div className={BOX} data-sample="live">
        <UiTwoColumnLayout
          aside={
            <>
              <Section headingLevel={3} title={t(K.live_summary)}>
                <Text>{t(K.summary_body)}</Text>
              </Section>
              {isHistoryShown ? (
                <Section headingLevel={3} title={t(K.live_history)}>
                  <Text>{t(K.history_body)}</Text>
                </Section>
              ) : null}
            </>
          }
        >
          <Section headingLevel={3} title={t(K.live_main)}>
            <Text>{t(K.order_body)}</Text>
          </Section>
        </UiTwoColumnLayout>
      </div>
      <Text role="status" tone="muted" data-sample="live-status">
        {t(K.history_status, { is_shown: isHistoryShown })}
      </Text>
    </div>
  );
}
