/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Icon: One icon per tone, each labelled with its tone name. With no tone the
 *          icon takes the colour of the text around it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import { TextTone } from "@stackra/ui/contracts";
import { Icon as UiIcon, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_KEYS } from "#src/demos/free/icon/icon-keys.constant";

/** The demo's keys. */
const K = ICON_KEYS.icon_page;

/** A sample with its caption underneath, the caption isolated left to right. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-center gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi dir="ltr">{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Icon demo: tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <ul className={ROW}>
        {TextTone.map((each) => (
          <Sample key={each} caption={each}>
            <UiIcon name="circle-check" size="lg" tone={each} label={each} />
          </Sample>
        ))}
      </ul>
      <Text tone="muted" className="flex items-center gap-2">
        <UiIcon name="circle-check" />
        <bdi>{t(K.inherits)}</bdi>
      </Text>
    </div>
  );
}
