/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Action menu: One row per size, one button per variant. The default is
 *          ghost, which sits quietly in a row.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
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

/** Action menu: Variants and sizes. */
export default function Variants() {
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
    <>
      {Size.map((size) => (
        <ul key={size} aria-label={t(K.size, { size })} className={ROW}>
          {ButtonVariant.map((variant) => (
            <Sample key={variant} caption={`${size} · ${variant}`}>
              <UiActionMenu
                label={`${t(K.variant_label, { variant })}, ${size}`}
                sections={ORDER_SECTIONS}
                variant={variant}
                size={size}
              />
            </Sample>
          ))}
        </ul>
      ))}
    </>
  );
}
