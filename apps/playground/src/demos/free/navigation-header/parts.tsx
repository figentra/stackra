/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web Navigation header: From the start of the bar: back button, start slot, title,
 *          end slot. The title takes the room left over, so the end slot stays at the end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 4, 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1,
 *          2.4.6, 2.5.8 and 4.1.3.
 */
import {
  Avatar,
  IconButton,
  NavigationHeader as UiNavigationHeader,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_HEADER_KEYS } from "#src/demos/free/navigation-header/navigation-header-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_HEADER_KEYS.navigation_header;

/** The box a header sits in, as a screen would hold it. */
const BOX = "overflow-hidden border border-border";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({
  caption,
  className,
  children,
}: {
  readonly caption: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={[BOX, className].filter(Boolean).join(" ")}>{children}</div>
    </li>
  );
}

/** A back handler that does nothing: the parts samples only show the button. */
const noop = () => undefined;

/** Navigation header: Parts. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={GRID}>
      <Sample caption={t(K.title_only)}>
        <UiNavigationHeader headingLevel={3} title={t(K.title)} />
      </Sample>
      <Sample caption={t(K.back_button)}>
        <UiNavigationHeader headingLevel={3} title={t(K.order_title)} onBack={noop} />
      </Sample>
      <Sample caption={t(K.back_link)}>
        <UiNavigationHeader
          headingLevel={3}
          title={t(K.order_title)}
          backHref="/"
          backLabel={t(K.back_home)}
        />
      </Sample>
      <Sample caption={t(K.slots)}>
        <UiNavigationHeader
          headingLevel={3}
          title={t(K.title)}
          onBack={noop}
          startContent={<Avatar name="Ada Lovelace" size="sm" />}
          endContent={
            <>
              <IconButton icon="bell" label={t(K.notifications)} variant="ghost" />
              <IconButton icon="plus" label={t(K.add)} variant="ghost" />
            </>
          }
        />
      </Sample>
      <Sample caption={t(K.long)} className="max-w-sm">
        <UiNavigationHeader
          headingLevel={3}
          title={t(K.long_title)}
          onBack={noop}
          endContent={<IconButton icon="plus" label={t(K.add)} variant="ghost" />}
        />
      </Sample>
      <Sample caption={t(K.large)}>
        <UiNavigationHeader
          headingLevel={3}
          title={t(K.title)}
          hasLargeTitle
          onBack={noop}
          endContent={<IconButton icon="plus" label={t(K.add)} variant="ghost" />}
        />
      </Sample>
    </ul>
  );
}
