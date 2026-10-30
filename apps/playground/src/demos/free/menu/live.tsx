/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Menu: Choose an action and the page reports its key. The open state is the
 *          page’s own: Open the menu opens it from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu as UiMenu, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_KEYS } from "#src/demos/free/menu/menu-keys.constant";

/** The demo's keys. */
const K = MENU_KEYS.menu;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Menu: Try it. */
export default function Live() {
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
  const [lastAction, setLastAction] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <UiMenu
          sections={ORDER_SECTIONS}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onAction={setLastAction}
        >
          <Button variant="secondary">{t(K.live_trigger)}</Button>
        </UiMenu>
        <Button variant="tertiary" onPress={() => setIsOpen(true)}>
          {t(K.open_from_outside)}
        </Button>
      </div>
      <Text role="status" data-testid="menu-last-action" tone="muted">
        {t(K.last_action, { key: lastAction ?? "none" })}
      </Text>
      <Text role="status" data-testid="menu-open-state" tone="muted">
        {t(K.open_state, { is_open: isOpen })}
      </Text>
    </div>
  );
}
