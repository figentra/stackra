/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Icon: Decorative icons: no label, so assistive technology skips them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import { ICON_SIZES } from "@stackra/ui";
import { Size } from "@stackra/ui/contracts";
import { Icon as UiIcon, Text } from "@stackra/ui/react";
import type { ReactNode } from "react";

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

/** The Icon demo: sizes. */
export default function Sizes() {
  return (
    <ul className={ROW}>
      {Size.map((each) => (
        <Sample key={each} caption={`${each} · ${ICON_SIZES[each]} px`}>
          <UiIcon name="search" size={each} />
        </Sample>
      ))}
    </ul>
  );
}
