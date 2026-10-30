/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Menu: Groups with a divider between, an icon, a second line, a shortcut hint,
 *          a danger action and a disabled one that says why.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu as UiMenu, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_KEYS } from "#src/demos/free/menu/menu-keys.constant";

/** The demo's keys. */
const K = MENU_KEYS.menu;

/** A sample with its caption underneath. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi>{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Menu: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  /** The groups of the first sample: editing, then the destructive ones with no visible heading. */
  const ORDER_SECTIONS: readonly MenuSection[] = [
    {
      id: "edit",
      title: t(K.sample.edit),
      items: [
        { id: "rename", label: t(K.sample.rename), icon: Icons.Pencil, shortcut: "⌘R" },
        {
          id: "duplicate",
          label: t(K.sample.duplicate),
          icon: Icons.Copy,
          shortcut: "⌘D",
          description: t(K.sample.make_a_copy_of_the),
        },
      ],
    },
    {
      id: "danger",
      title: t(K.sample.danger_zone),
      isTitleHidden: true,
      items: [
        {
          id: "archive",
          label: t(K.sample.archive),
          icon: Icons.Archive,
          isDisabled: true,
          disabledReason: t(K.sample.paid_orders_cannot_be_archived),
        },
        {
          id: "delete",
          label: t(K.sample.delete),
          icon: Icons.Trash,
          tone: "danger",
          shortcut: "⌘Del",
        },
      ],
    },
  ];
  /** A plain menu: one group of labels. */
  const PLAIN_SECTIONS: readonly MenuSection[] = [
    {
      id: "sort",
      title: t(K.sample.sort),
      isTitleHidden: true,
      items: [
        { id: "newest", label: t(K.sample.newest_first) },
        { id: "oldest", label: t(K.sample.oldest_first) },
      ],
    },
  ];
  return (
    <ul className={ROW}>
      <Sample caption={t(K.order_actions_caption)}>
        <UiMenu sections={ORDER_SECTIONS}>
          <Button variant="secondary">{t(K.order_actions)}</Button>
        </UiMenu>
      </Sample>
      <Sample caption={t(K.plain_caption)}>
        <UiMenu sections={PLAIN_SECTIONS}>
          <Button variant="secondary">{t(K.plain)}</Button>
        </UiMenu>
      </Sample>
    </ul>
  );
}
