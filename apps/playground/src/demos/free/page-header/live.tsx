/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Page header: Mark the order as shipped: the status changes and the primary
 *          action becomes Undo shipping. Choose an entry in the menu and the page reports it below.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { PageHeader as UiPageHeader, StatusBadge, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_KEYS } from "#src/demos/free/page-header/page-header-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_KEYS.page_header;

/** The card a header sits in, as the top of a page would. */
const CARD = "border border-border p-4";

/** Page header: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isShipped, setIsShipped] = useState(false);

  const [action, setAction] = useState<string | null>(null);

  const choose = (label: string) => () => setAction(label);

  return (
    <div className="grid gap-3">
      <div className={CARD} data-sample="live">
        <UiPageHeader
          headingLevel={3}
          title={t(K.order)}
          description={t(K.placed)}
          status={
            <StatusBadge tone={isShipped ? "accent" : "success"}>
              {isShipped ? t(K.shipped) : t(K.paid)}
            </StatusBadge>
          }
          moreActionsLabel={t(K.more_actions)}
          actions={[
            {
              id: "ship",
              label: isShipped ? t(K.undo_shipping) : t(K.mark_shipped),
              onPress: () => setIsShipped((shipped) => !shipped),
            },
            { id: "edit", label: t(K.edit), onPress: choose(t(K.edit)) },
            { id: "export", label: t(K.export), onPress: choose(t(K.export)) },
            { id: "duplicate", label: t(K.duplicate), onPress: choose(t(K.duplicate)) },
            { id: "print", label: t(K.print), onPress: choose(t(K.print)) },
          ]}
        />
      </div>
      <Text role="status" tone="muted" data-sample="live-status">
        {t(K.action_status, { action: action ?? "none" })}
      </Text>
    </div>
  );
}
