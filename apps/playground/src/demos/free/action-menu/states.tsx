/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Action menu: A disabled action menu shows the disabled style and never opens.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { ActionMenu as UiActionMenu, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACTION_MENU_KEYS } from "#src/demos/free/action-menu/action-menu-keys.constant";

/** The demo's keys. */
const K = ACTION_MENU_KEYS.action_menu;

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

/** Action menu: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The groups of an order's actions: editing, then the destructive ones. */
  const ORDER_SECTIONS: readonly MenuSection[] = [
    {
      id: "edit",
      title: t(K.sample.edit),
      isTitleHidden: true,
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
  return (
    <ul className={ROW}>
      <Sample caption={t(K.disabled_caption)}>
        <UiActionMenu label={t(K.disabled_label)} sections={ORDER_SECTIONS} isDisabled />
      </Sample>
    </ul>
  );
}
