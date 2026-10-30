/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Action menu: The row opens when it is pressed, and Open order is its keyboard
 *          route. A press on the menu button, or on an action in the menu, never opens the row.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import {
  ActionMenu as UiActionMenu,
  Button,
  Surface,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACTION_MENU_KEYS } from "#src/demos/free/action-menu/action-menu-keys.constant";

/** The demo's keys. */
const K = ACTION_MENU_KEYS.action_menu;

/** Action menu: Try it. */
export default function Live() {
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
  const [rowOpened, setRowOpened] = useState(0);

  const [lastAction, setLastAction] = useState<string | null>(null);

  const openRow = () => setRowOpened((count) => count + 1);

  return (
    <div className="grid gap-6">
      <Surface
        variant="secondary"
        className="flex items-center justify-between gap-4 p-3"
        // A press on the row's own text opens it; a button inside counts its own press, so none counts twice.
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) openRow();
        }}
      >
        <Text>{t(K.row_title)}</Text>
        <div className="flex items-center gap-2">
          <Button variant="tertiary" onPress={openRow}>
            {t(K.open_order)}
          </Button>
          <UiActionMenu
            label={t(K.basics_label)}
            sections={ORDER_SECTIONS}
            onAction={setLastAction}
          />
        </div>
      </Surface>
      <Text role="status" data-testid="action-menu-row-opened" tone="muted">
        {t(K.row_opened, { count: rowOpened })}
      </Text>
      <Text role="status" data-testid="action-menu-last-action" tone="muted">
        {t(K.last_action, { key: lastAction ?? "none" })}
      </Text>
    </div>
  );
}
