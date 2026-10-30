/**
 * Stackra file contract:
 * Purpose: the "passthrough" demo of the web Icon: Every other SVG prop reaches the icon: a thinner stroke and a
 *          class are set here.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
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

/** Icon: Pass-through. */
export default function Passthrough() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <Sample caption={t(K.thin_stroke)}>
        <UiIcon name="search" size="lg" strokeWidth={1.5} />
      </Sample>
      <Sample caption={t(K.with_class)}>
        <UiIcon name="search" size="lg" className="opacity-50" data-testid="passed-class" />
      </Sample>
    </ul>
  );
}
