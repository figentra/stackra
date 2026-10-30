/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web Page header: Only the title is required. The description, the status, the
 *          start slot, the trail and the actions are optional.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import type { MenuLeafItem } from "@stackra/ui/contracts";
import {
  Avatar,
  PageHeader as UiPageHeader,
  StatusBadge,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_KEYS } from "#src/demos/free/page-header/page-header-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_KEYS.page_header;

/** The card a header sits in, as the top of a page would. */
const CARD = "border border-border p-4";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={CARD}>{children}</div>
    </li>
  );
}

/** `count` actions named for what a page does, the first of them creating. */
const actionsOf = (t: ReturnType<typeof useCatalogueText>, count: number): MenuLeafItem[] => {
  const all: MenuLeafItem[] = [
    { id: "create", label: t(K.create), icon: Icons.Plus },
    { id: "edit", label: t(K.edit) },
    { id: "export", label: t(K.export), icon: Icons.Download },
    { id: "duplicate", label: t(K.duplicate), icon: Icons.Copy },
    { id: "print", label: t(K.print) },
    { id: "archive", label: t(K.archive) },
  ];
  return all.slice(0, count);
};

/** Page header: Parts. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);

  return (
    <ul className={GRID}>
      <Sample caption={t(K.title_only)}>
        <UiPageHeader headingLevel={3} title={t(K.order)} />
      </Sample>
      <Sample caption={t(K.description)}>
        <UiPageHeader headingLevel={3} title={t(K.order)} description={t(K.placed)} />
      </Sample>
      <Sample caption={t(K.status)}>
        <UiPageHeader
          headingLevel={3}
          title={t(K.order)}
          status={<StatusBadge tone="success">{t(K.paid)}</StatusBadge>}
        />
      </Sample>
      <Sample caption={t(K.start)}>
        <UiPageHeader
          headingLevel={3}
          title={t(K.order)}
          description={t(K.placed)}
          startContent={<Avatar name="Ada Lovelace" shape="square" />}
        />
      </Sample>
      <Sample caption={t(K.every)}>
        <UiPageHeader
          headingLevel={3}
          breadcrumbs={[
            { id: "orders", label: t(K.orders), href: "/" },
            { id: "customers", label: t(K.customers), href: "/page-header" },
            { id: "order", label: t(K.order) },
          ]}
          title={t(K.order)}
          description={t(K.placed)}
          status={<StatusBadge tone="success">{t(K.paid)}</StatusBadge>}
          startContent={<Avatar name="Ada Lovelace" shape="square" />}
          actions={actionsOf(t, 3)}
        />
      </Sample>
    </ul>
  );
}
