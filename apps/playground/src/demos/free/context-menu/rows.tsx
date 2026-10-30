/**
 * Stackra file contract:
 * Purpose: the "rows" demo of the web ContextMenu: rows with a right-click menu.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { ContextMenu, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CONTEXT_MENU_KEYS } from "#src/demos/free/context-menu/context-menu-keys.constant";

/** The demo's keys. */
const K = CONTEXT_MENU_KEYS.context_menu;

/** Context menu: right-click (or Shift+F10 on) an order row. */
export default function Rows() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState("");
  const sections = [
    {
      id: "main",
      title: t(K.actions),
      isTitleHidden: true,
      items: [
        { id: "open", label: t(K.open), icon: "external-link" as const },
        { id: "duplicate", label: t(K.duplicate), icon: "copy" as const },
        { id: "archive", label: t(K.archive), icon: "archive" as const },
      ],
    },
    {
      id: "danger",
      title: t(K.danger),
      isTitleHidden: true,
      items: [
        { id: "delete", label: t(K.delete), icon: "trash" as const, tone: "danger" as const },
      ],
    },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <p className="m-0 text-xs text-muted">{t(K.hint)}</p>
      {["ORD-2048", "ORD-2049", "ORD-2050"].map((order) => (
        <ContextMenu
          key={order}
          label={t(K.label)}
          sections={sections}
          onAction={(id) => setChosen(`${order} · ${t(K[id as "open"])}`)}
        >
          <div
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: the row is the context menu target; it takes focus so a keyboard user can open the menu (Shift+F10)
            tabIndex={0}
            className="rounded-lg border border-separator px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <bdi>{order}</bdi>
          </div>
        </ContextMenu>
      ))}
      <p role="status" className="m-0 text-sm text-muted">
        {chosen ? t(K.chosen, { action: chosen }) : ""}
      </p>
    </div>
  );
}
