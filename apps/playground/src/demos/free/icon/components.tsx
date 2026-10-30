/**
 * Stackra file contract:
 * Purpose: the "components" demo of the web Icon: An alias resolves to a Lucide icon, and an app’s own SVG component
 *          is registered under its own namespace: both are drawn through Icon, by name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import { defineIconRegistry } from "@stackra/icons";
import type { IconComponentProps } from "@stackra/icons/contracts";
import { IconRegistryProvider } from "@stackra/icons/react";
import { Size } from "@stackra/ui/contracts";
import { Icon as UiIcon, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_KEYS } from "#src/demos/free/icon/icon-keys.constant";

/** The demo's keys. */
const K = ICON_KEYS.icon_page;

/** An app's own icon: a ring and a dot on Lucide's 24-unit grid, drawn in `currentColor` like a Lucide icon. */
function Mark({ size = 24, strokeWidth = 2 }: IconComponentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/** The page's own custom icon, registered under its namespace so it is drawn by name like any other. */
const PAGE_ICONS = defineIconRegistry({ "playground::mark": Mark });

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

/** Icon: Names, aliases and custom icons. */
export default function Components() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <ul className={ROW}>
        <Sample caption={t(K.alias)}>
          <UiIcon name="orders" size="lg" />
        </Sample>
        {Size.map((each) => (
          <Sample key={each} caption={`playground::mark · ${each}`}>
            <UiIcon name="playground::mark" size={each} />
          </Sample>
        ))}
        <Sample caption={t(K.raw_element)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Sample>
      </ul>
    </IconRegistryProvider>
  );
}
