/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the web Icon: Switch the language to Arabic: the icons that point the reading way flip,
 *          the ones that depict an object do not.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import type { IconName } from "@stackra/icons/contracts";
import { Heading, Icon as UiIcon, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_KEYS } from "#src/demos/free/icon/icon-keys.constant";

/** The demo's keys. */
const K = ICON_KEYS.icon_page;

/** The directional icons that mirror, each labelled so it can be found by its name. */
const MIRRORED: readonly (readonly [string, IconName])[] = [
  ["Next", "chevron-right"],
  ["Continue", "arrow-right"],
  ["Send", "send-horizontal"],
  ["Undo", "undo-2"],
];

/** The icons that depict an object, a check or media, and so are never mirrored. */
const NEVER_MIRRORED: readonly (readonly [string, IconName])[] = [
  ["Search", "search"],
  ["Done", "check"],
  ["Play", "play"],
];

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

/** Icon: Right to left. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Heading level={3}>{t(K.mirrored)}</Heading>
      <ul className={ROW}>
        {MIRRORED.map(([label, name]) => (
          <Sample key={label} caption={name}>
            <UiIcon name={name} size="lg" label={label} isMirroredInRtl />
          </Sample>
        ))}
      </ul>
      <Heading level={3}>{t(K.never_mirrored)}</Heading>
      <ul className={ROW}>
        {NEVER_MIRRORED.map(([label, name]) => (
          <Sample key={label} caption={name}>
            <UiIcon name={name} size="lg" label={label} />
          </Sample>
        ))}
      </ul>
    </div>
  );
}
